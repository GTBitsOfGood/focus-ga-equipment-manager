import { LightningElement, api, wire } from "lwc";
import { getRecord, getFieldValue } from "lightning/uiRecordApi";

import FOLLOW_UP_STATUS from "@salesforce/schema/Equipment_Program__c.Annual_Follow_Up_Status__c";
import NEXT_DATE from "@salesforce/schema/Equipment_Program__c.Next_Follow_Up_Date__c";
import LAST_DATE from "@salesforce/schema/Equipment_Program__c.Last_Follow_Up_Date__c";

export default class AnnualFollowUp extends LightningElement {
  @api recordId;
  // Retained for existing Lightning pages; scheduling uses the formula fields.
  @api reminderDays = 30;

  @wire(getRecord, {
    recordId: "$recordId",
    fields: [FOLLOW_UP_STATUS, NEXT_DATE, LAST_DATE]
  })
  program;

  get isLoading() {
    return !this.program?.data && !this.program?.error;
  }

  get hasError() {
    return Boolean(this.program?.error);
  }

  get followUpStatus() {
    return getFieldValue(this.program?.data, FOLLOW_UP_STATUS);
  }

  get nextDate() {
    return getFieldValue(this.program?.data, NEXT_DATE);
  }

  get lastDate() {
    return getFieldValue(this.program?.data, LAST_DATE);
  }
}
