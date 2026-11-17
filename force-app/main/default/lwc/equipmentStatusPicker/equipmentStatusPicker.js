import { LightningElement, api, wire } from "lwc";
import { getRecord, updateRecord } from "lightning/uiRecordApi";
import { getObjectInfo, getPicklistValues } from "lightning/uiObjectInfoApi";
import EQUIPMENT_OBJECT from "@salesforce/schema/Equipment__c";
import STATUS_FIELD from "@salesforce/schema/Equipment__c.Status__c";

export default class EquipmentStatusPicker extends LightningElement {
  @api recordId;
  @api recordName;
  @api value;
  @api internalTabIndex = -1;
  isSaving = false;
  currentValue;
  recordTypeId;
  recordLoaded = false;
  errorMessage;

  @wire(getObjectInfo, { objectApiName: EQUIPMENT_OBJECT })
  objectInfo;

  @wire(getRecord, { recordId: "$recordId", fields: [STATUS_FIELD] })
  wiredRecord({ data, error }) {
    if (data) {
      this.recordTypeId = data.recordTypeId || "012000000000000AAA";
      this.currentValue = data.fields.Status__c.value || "";
      this.recordLoaded = true;
    } else if (error) {
      this.recordLoaded = false;
    }
  }

  @wire(getPicklistValues, {
    recordTypeId: "$recordTypeId",
    fieldApiName: STATUS_FIELD
  })
  picklist;

  get accessibleLabel() {
    return `Status for ${this.recordName || "equipment"}`;
  }

  get selectedValue() {
    return this.currentValue ?? this.value ?? "";
  }

  get isRequired() {
    return this.objectInfo.data?.fields.Status__c?.required || false;
  }

  get isDisabled() {
    return this.isSaving || !this.recordLoaded || !this.picklist.data ||
      !this.objectInfo.data?.updateable ||
      !this.objectInfo.data?.fields.Status__c?.updateable;
  }

  get options() {
    const values = [...(this.picklist.data?.values || [])];
    // Preserve an existing value even if it is no longer an active option.
    if (this.selectedValue && !values.some((item) => item.value === this.selectedValue)) {
      values.unshift({ value: this.selectedValue, label: this.selectedValue });
    }
    if (!this.isRequired) {
      values.unshift({ value: "", label: "--None--" });
    }
    return values.map((item) => ({
      ...item,
      selected: item.value === this.selectedValue
    }));
  }

  get statusIndicatorClass() {
    const classes = {
      "Ready for Checkout": "status-ready",
      "Checkout Pending": "status-pending",
      Out: "status-out",
      Repair: "status-repair",
      Inactive: "status-inactive"
    };
    return `status-indicator ${classes[this.selectedValue] || "status-all"}`;
  }

  async handleChange(event) {
    const field = event.target;
    const value = field.value;
    const previousValue = this.selectedValue;
    if (this.isDisabled || value === previousValue || !field.reportValidity()) {
      return;
    }
    this.isSaving = true;
    this.errorMessage = undefined;
    try {
      await updateRecord({ fields: { Id: this.recordId, Status__c: value || null } });
      this.currentValue = value;
      this.dispatchEvent(new CustomEvent("statuschanged", {
        detail: { recordId: this.recordId },
        bubbles: true,
        composed: true
      }));
    } catch (error) {
      this.currentValue = previousValue;
      field.value = previousValue;
      const output = error.body?.output;
      this.errorMessage = output?.fieldErrors?.Status__c?.[0]?.message ||
        output?.errors?.[0]?.message || error.body?.message ||
        "Unable to save status. Please try again.";
    } finally {
      this.isSaving = false;
    }
  }
}
