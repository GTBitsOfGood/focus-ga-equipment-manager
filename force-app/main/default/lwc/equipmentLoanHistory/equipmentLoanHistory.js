
import { LightningElement, api, wire } from "lwc";
import { CurrentPageReference } from "lightning/navigation";

const MOCK_LOANS = [
  {
    Id: "a01000000000001AAA",
    Name: "EP-1002",
    Child_In_Need__c: "a02000000000001AAA",
    Child_In_Need__r: { Name: "Alex Smith" },
    Funds_Released_Date__c: "2026-05-15",
    Delivered_Date__c: "2026-05-20",
    Status__c: "Delivered"
  },
  {
    Id: "a01000000000002AAA",
    Name: "EP-1001",
    Child_In_Need__c: "a02000000000002AAA",
    Child_In_Need__r: { Name: "Jamie Lee" },
    Funds_Released_Date__c: "2025-03-10",
    Delivered_Date__c: "2025-03-18",
    Status__c: "Equipment Returned"
  }
];

export default class EquipmentLoanHistory extends LightningElement {
  @api recordId;

  equipmentId;
  isLoading = false;
  errorMessage;
  loanHistory = [];

  @wire(CurrentPageReference)
  getPageReference(pageReference) {
    if (pageReference) {
      this.equipmentId =
        pageReference.state?.c__equipmentId ||
        this.recordId;
    }
  }

  connectedCallback() {
    this.loanHistory = this.formatLoans(MOCK_LOANS);
  }

  get equipment() {
    if (!this.equipmentId) {
      return null;
    }

    return {
      name: "Sample Equipment",
      equipmentId: "EQ-001",
      recordUrl: `/lightning/r/Equipment__c/${this.equipmentId}/view`
    };
  }

  get columns() {
    return [
      {
        label: "Child's Name",
        fieldName: "childUrl",
        type: "url",
        typeAttributes: {
          label: { fieldName: "childName" },
          target: "_self"
        },
        hideDefaultActions: true
      },
      {
        label: "Equipment Program",
        fieldName: "programUrl",
        type: "url",
        typeAttributes: {
          label: { fieldName: "programName" },
          target: "_self"
        },
        hideDefaultActions: true
      },
      {
        label: "Funds Released Date",
        fieldName: "fundsReleasedDate",
        type: "date-local",
        hideDefaultActions: true
      },
      {
        label: "Delivered Date",
        fieldName: "deliveredDate",
        type: "date-local",
        hideDefaultActions: true
      },
      {
        label: "Status",
        fieldName: "status",
        type: "text",
        hideDefaultActions: true
      }
    ];
  }

  formatLoans(records) {
    return (records || []).map((record) => ({
      id: record.Id,
      childName: record.Child_In_Need__r?.Name || "",
      childUrl: record.Child_In_Need__c
        ? `/lightning/r/Child_In_Need__c/${record.Child_In_Need__c}/view`
        : null,
      programName: record.Name || "",
      programUrl: `/lightning/r/Equipment_Program__c/${record.Id}/view`,
      fundsReleasedDate: record.Funds_Released_Date__c || null,
      deliveredDate: record.Delivered_Date__c || null,
      status: record.Status__c || ""
    }));
  }

  get isEmpty() {
    return (
      !this.isLoading &&
      !this.errorMessage &&
      this.loanHistory.length === 0
    );
  }
}
