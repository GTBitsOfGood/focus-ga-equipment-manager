"""Offline contracts for the scheduled flow. These do not execute Salesforce email.

Run: python3 -m unittest discover -s scripts/tests -v
"""

from pathlib import Path
import unittest
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "force-app/main/default"
NS = {"m": "http://soap.sforce.com/2006/04/metadata"}


def read(path):
    return ET.parse(path).getroot()


def text(node, path):
    return node.findtext(path, namespaces=NS)


class AnnualFollowUpMetadataTest(unittest.TestCase):
    def setUp(self):
        self.flow = read(SOURCE / "flows/Equipment_Program_Annual_Follow_Up_Email.flow-meta.xml")
        self.send = self.flow.find("m:actionCalls", NS)

    def updates_after(self, name):
        """Follow normal connectors, returning all reachable record assignments."""
        nodes = {text(node, "m:name"): node for node in self.flow if text(node, "m:name")}
        assignments = {}
        visited = set()
        while name:
            self.assertNotIn(name, visited, "Unexpected cycle in send-result path")
            visited.add(name)
            node = nodes[name]
            for assignment in node.findall("m:inputAssignments", NS):
                assignments[text(assignment, "m:field")] = text(assignment, "m:value/m:elementReference")
            name = text(node, "m:connector/m:targetReference")
        return assignments

    def test_success_records_actual_date_and_clears_previous_failure(self):
        updates = self.updates_after(text(self.send, "m:connector/m:targetReference"))
        self.assertEqual(updates["Last_Follow_Up_Date__c"], "$Flow.CurrentDate")
        self.assertIsNone(updates["Last_Follow_Up_Error__c"])

    def test_failed_email_is_investigable_and_never_marked_sent(self):
        fault = text(self.send, "m:faultConnector/m:targetReference")
        self.assertIsNotNone(fault)
        updates = self.updates_after(fault)
        self.assertNotIn("Last_Follow_Up_Date__c", updates)
        self.assertEqual(updates["Last_Follow_Up_Error__c"], "$Flow.FaultMessage")
        node = next(node for node in self.flow if text(node, "m:name") == fault)
        self.assertEqual(text(node, "m:object"), "Equipment_Program__c")
        self.assertEqual(text(node, "m:filters/m:value/m:elementReference"), "$Record.Id")

    def test_email_recipient_sender_and_activity_logging(self):
        params = {text(p, "m:name"): p.find("m:value", NS)
                  for p in self.send.findall("m:inputParameters", NS)}
        self.assertEqual(text(params["recipientAddresses"], "m:collectionElements/m:elementReference"), "$Record.Parent_Email__c")
        self.assertEqual(text(params["senderType"], "m:stringValue"), "OrgWideEmailAddress")
        self.assertEqual(text(params["senderAddress"], "m:stringValue"), "equipment@focus-ga.org")
        self.assertEqual(text(params["relatedRecordId"], "m:elementReference"), "$Record.Id")
        self.assertEqual(text(params["logEmailOnSend"], "m:booleanValue"), "true")
        self.assertNotIn("sandbox", text(params["emailBody"], "m:stringValue").lower())

    def test_daily_flow_uses_shared_eligibility_and_remains_draft(self):
        self.assertEqual(text(self.flow, "m:label"), "Equipment Program Annual Follow-Up")
        self.assertEqual(text(self.flow, "m:status"), "Draft")
        self.assertEqual(text(self.flow, "m:start/m:object"), "Equipment_Program__c")
        self.assertEqual(text(self.flow, "m:start/m:schedule/m:frequency"), "Daily")
        self.assertEqual(text(self.flow, "m:start/m:filters/m:field"), "Annual_Follow_Up_Status__c")
        self.assertEqual(text(self.flow, "m:start/m:filters/m:value/m:stringValue"), "Follow-Up Required")
        view = read(SOURCE / "objects/Equipment_Program__c/listViews/Annual_Follow_Ups_Required.listView-meta.xml")
        self.assertEqual(text(view, "m:filters/m:field"), "Annual_Follow_Up_Status__c")
        self.assertEqual(text(view, "m:filters/m:value"), "Follow-Up Required")
        fields = SOURCE / "objects/Equipment_Program__c/fields"
        for name in ("Next_Follow_Up_Date__c", "Annual_Follow_Up_Cursor__c", "Annual_Follow_Up_Status__c"):
            formula = text(read(fields / f"{name}.field-meta.xml"), "m:formula")
            self.assertNotIn("Delivered_Date__c", formula)
        self.assertNotIn("Delivered_Date__c", ET.tostring(self.flow, encoding="unicode"))

    def test_error_field_is_deployed_readable_and_visible_for_staff(self):
        field = "Equipment_Program__c.Last_Follow_Up_Error__c"
        package = read(ROOT / "manifest/package.xml")
        members = [node.text for node in package.findall("m:types/m:members", NS)]
        self.assertIn(field, members)
        self.assertIn("AnnualFollowUpFormulaTest", members)
        permission = read(SOURCE / "permissionsets/Equipment_Manager.permissionset-meta.xml")
        grants = [node for node in permission.findall("m:fieldPermissions", NS)
                  if text(node, "m:field") == field]
        self.assertEqual(len(grants), 1)
        self.assertEqual(text(grants[0], "m:readable"), "true")
        layout = read(SOURCE / "layouts/Equipment_Program__c-Equipment Program Layout.layout-meta.xml")
        self.assertIn("Last_Follow_Up_Error__c", [node.text for node in layout.findall(".//m:field", NS)])

    def test_record_page_has_component_without_unused_reminder_setting(self):
        page = read(SOURCE / "flexipages/Equipment_Program_Record_Page.flexipage-meta.xml")
        self.assertIn("annualFollowUp", [node.text for node in page.findall(".//m:componentName", NS)])
        self.assertNotIn("reminderDays", ET.tostring(page, encoding="unicode"))
        bundle = SOURCE / "lwc/annualFollowUp"
        for file in ("annualFollowUp.js", "annualFollowUp.js-meta.xml"):
            self.assertNotIn("reminderDays", (bundle / file).read_text())


if __name__ == "__main__":
    unittest.main()
