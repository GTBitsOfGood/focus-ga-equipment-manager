
import { LightningElement, api, wire } from "lwc";
import { CurrentPageReference } from "lightning/navigation";
import getLoanHistory from "@salesforce/apex/LoanHistoryController.getLoanHistory";

const COLUMNS = [
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

export default class EquipmentLoanHistory extends LightningElement {
  @api recordId;

  pageEquipmentId;
  equipment = null;
  loanHistory = [];
  errorMessage = null;
  hasResponse = false;

  columns = COLUMNS;

  @wire(CurrentPageReference)
  getPageReference(pageReference) {
    const nextId = pageReference?.state?.c__equipmentId;

    if (this.pageEquipmentId !== nextId) {
      this.pageEquipmentId = nextId;
      this.hasResponse = false;
      this.equipment = null;
      this.loanHistory = [];
      this.errorMessage = null;
    }
  }

  get selectedEquipmentId() {
    return this.pageEquipmentId || this.recordId;
  }

  @wire(getLoanHistory, { equipmentId: "$selectedEquipmentId" })
  wiredLoanHistory({ data, error }) {
    if (data) {
      this.equipment = {
        name: data.equipment?.name || "",
        equipmentId:
          data.equipment?.equipmentNumber ||
          data.equipment?.id ||
          "",
        recordUrl: data.equipment?.id
          ? `/lightning/r/Equipment__c/${data.equipment.id}/view`
          : null
      };

      this.loanHistory = this.formatLoans(data.rows);
      this.errorMessage = null;
      this.hasResponse = true;
    } else if (error) {
      this.equipment = null;
      this.loanHistory = [];
      this.errorMessage =
        error.body?.message ||
        "Unable to load equipment loan history.";
      this.hasResponse = true;
    }
  }

  formatLoans(records) {
    return (records || []).map((record) => ({
      id: record.programId,
      childName: record.childName || "",
      childUrl: record.childId
        ? `/lightning/r/Contact/${record.childId}/view`
        : null,
      programName: record.programName || "",
      programUrl: record.programId
        ? `/lightning/r/Equipment_Program__c/${record.programId}/view`
        : null,
      fundsReleasedDate: record.fundsReleasedDate || null,
      deliveredDate: record.deliveredDate || null,
      status: record.status || ""
    }));
  }

  get isLoading() {
    return Boolean(this.selectedEquipmentId) && !this.hasResponse;
  }

  get noEquipmentSelected() {
    return !this.selectedEquipmentId;
  }

  get isEmpty() {
    return (
      !this.noEquipmentSelected &&
      !this.isLoading &&
      !this.errorMessage &&
      this.loanHistory.length === 0
    );
  }
}
