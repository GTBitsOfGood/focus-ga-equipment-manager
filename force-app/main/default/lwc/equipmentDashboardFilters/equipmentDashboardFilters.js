import { LightningElement, api, wire } from "lwc";
import { getObjectInfo, getPicklistValues } from "lightning/uiObjectInfoApi";
import EQUIPMENT_OBJECT from "@salesforce/schema/Equipment__c";
import STATUS_FIELD from "@salesforce/schema/Equipment__c.Status__c";

const DEBOUNCE_MS = 300;
const MASTER_RECORD_TYPE_ID = "012000000000000AAA";

export default class EquipmentDashboardFilters extends LightningElement {
  _searchTerm = "";
  _statusValue = "";
  _sizeValue = "";
  _colorValue = "";

  // Default to the master record type so the picklist can load.
  recordTypeId = MASTER_RECORD_TYPE_ID;

  statusOptions = [{ label: "All", value: "" }];
  searchDebounceId;

  @api
  get searchTerm() {
    return this._searchTerm;
  }

  set searchTerm(value) {
    this._searchTerm = value || "";
  }

  @api
  get statusValue() {
    return this._statusValue;
  }

  set statusValue(value) {
    this._statusValue = value || "";
  }

  @api
  get sizeValue() {
    return this._sizeValue;
  }

  set sizeValue(value) {
    this._sizeValue = value || "";
  }

  @api
  get colorValue() {
    return this._colorValue;
  }

  set colorValue(value) {
    this._colorValue = value || "";
  }

  // Get the correct record type for the Equipment object.
  @wire(getObjectInfo, { objectApiName: EQUIPMENT_OBJECT })
  handleObjectInfo({ data, error }) {
    if (data) {
      this.recordTypeId = data.defaultRecordTypeId || MASTER_RECORD_TYPE_ID;
    } else if (error) {
      console.error("Failed to load Equipment object metadata:", error);

      // Continue using the master record type.
      this.recordTypeId = MASTER_RECORD_TYPE_ID;
    }
  }

  // Retrieve Status values dynamically from Salesforce.
  @wire(getPicklistValues, {
    recordTypeId: "$recordTypeId",
    fieldApiName: STATUS_FIELD
  })
  handleStatusValues({ data, error }) {
    if (data) {
      const values = data.values || [];

      this.statusOptions = [
        { label: "All", value: "" },
        ...values.map((item) => ({
          label: item.label,
          value: item.value
        }))
      ];
    } else if (error) {
      console.error("Failed to load Equipment Status picklist:", error);

      this.statusOptions = [{ label: "All", value: "" }];
    }
  }

  disconnectedCallback() {
    this.clearPendingDebounce();
  }

  @api
  handleSearchChange(event) {
    this._searchTerm = event.target.value || "";
    this.scheduleApplyFilters();
  }

  @api
  handleStatusChange(event) {
    // Cancel any pending text debounce to prevent duplicate events.
    this.clearPendingDebounce();

    this._statusValue = event.detail.value || "";

    // Status dropdown changes apply immediately.
    this.emitFilters();
  }

  @api
  handleSizeChange(event) {
    this._sizeValue = event.target.value || "";
    this.scheduleApplyFilters();
  }

  @api
  handleColorChange(event) {
    this._colorValue = event.target.value || "";
    this.scheduleApplyFilters();
  }

  @api
  clearFilters() {
    // Prevent an old timer from reapplying previous filters.
    this.clearPendingDebounce();

    this._searchTerm = "";
    this._statusValue = "";
    this._sizeValue = "";
    this._colorValue = "";

    // Immediately notify the parent of the cleared state.
    this.emitFilters();
  }

  scheduleApplyFilters() {
    this.clearPendingDebounce();

    // Debounce text inputs to avoid unnecessary Apex requests.
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    this.searchDebounceId = setTimeout(() => {
      this.searchDebounceId = undefined;
      this.emitFilters();
    }, DEBOUNCE_MS);
  }

  clearPendingDebounce() {
    if (this.searchDebounceId !== undefined) {
      clearTimeout(this.searchDebounceId);
      this.searchDebounceId = undefined;
    }
  }

  @api
  emitFilters() {
    const detail = {
      searchTerm: this.searchTerm.trim(),
      status: this.statusValue || "",
      size: this.sizeValue.trim(),
      color: this.colorValue.trim()
    };

    this.dispatchEvent(
      new CustomEvent("filterschange", {
        detail,
        bubbles: true,
        composed: true
      })
    );
  }
}
