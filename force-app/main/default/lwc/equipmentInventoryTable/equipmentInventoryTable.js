import { LightningElement, api, wire } from "lwc";
import getEquipmentRecords from "@salesforce/apex/EquipmentInventoryController.getEquipmentRecords";

const DEFAULT_SORT_BY = "Name";
const DEFAULT_SORT_DIRECTION = "asc";
const DISPLAY_SORT_BY = "recordUrl";

export default class EquipmentInventoryTable extends LightningElement {
  _filters = {
    searchTerm: "",
    status: "",
    size: "",
    color: ""
  };
  _records = [];
  _totalCount = 0;
  _error;
  _isLoading = true;
  _sortedBy = DISPLAY_SORT_BY;
  _sortDirection = DEFAULT_SORT_DIRECTION;
  _sortFieldForApex = DEFAULT_SORT_BY;

  @api
  get filters() {
    return this._filters;
  }
  set filters(value) {
    this._filters = value || {
      searchTerm: "",
      status: "",
      size: "",
      color: ""
    };
    this.beginLoading();
  }

  @api
  get records() {
    return this._records;
  }
  set records(value) {
    this._records = value || [];
  }

  @api
  get totalCount() {
    return this._totalCount;
  }
  set totalCount(value) {
    this._totalCount = Number(value) || 0;
  }

  @api
  get error() {
    return this._error;
  }
  set error(value) {
    this._error = value;
  }

  @api
  get isLoading() {
    return this._isLoading;
  }
  set isLoading(value) {
    this._isLoading = Boolean(value);
  }

  @api
  get sortedBy() {
    return this._sortedBy;
  }
  set sortedBy(value) {
    this._sortedBy = value || DISPLAY_SORT_BY;
  }

  @api
  get sortDirection() {
    return this._sortDirection;
  }
  set sortDirection(value) {
    this._sortDirection = value || DEFAULT_SORT_DIRECTION;
  }

  @api
  get sortFieldForApex() {
    return this._sortFieldForApex;
  }
  set sortFieldForApex(value) {
    this._sortFieldForApex = value || DEFAULT_SORT_BY;
  }

  @wire(getEquipmentRecords, {
    searchTerm: "$filters.searchTerm",
    status: "$filters.status",
    size: "$filters.size",
    color: "$filters.color",
    sortBy: "$sortFieldForApex",
    sortDirection: "$sortDirection",
    pageSize: null,
    pageNumber: null
  })
  wiredEquipment({ data, error }) {
    this.handleDataResponse({ data, error });
  }

  beginLoading() {
    this._isLoading = true;
    this._error = undefined;
    this._records = [];
    this._totalCount = 0;
  }

  @api
  handleDataResponse({ data, error }) {
    if (data) {
      this._records = (data.records || []).map((record) => ({
        ...record,
        recordUrl: `/lightning/r/Equipment__c/${record.Id}/view`
      }));
      this._totalCount = data.totalCount || 0;
      this._error = undefined;
      this._isLoading = false;
    } else if (error) {
      this._records = [];
      this._totalCount = 0;
      this._error =
        "Unable to load equipment records right now. Please try again.";
      this._isLoading = false;
    }
  }

  get columns() {
    return [
      {
        label: "Equipment Name",
        fieldName: "recordUrl",
        type: "url",
        sortable: true,
        wrapText: true,
        typeAttributes: {
          label: { fieldName: "Name" },
          target: "_self"
        }
      },
      {
        label: "Equipment ID",
        fieldName: "Equipment_ID__c",
        type: "text",
        sortable: true
      },
      { label: "Size", fieldName: "Size__c", type: "text", sortable: true },
      { label: "Color", fieldName: "Color__c", type: "text", sortable: true },
      { label: "Status", fieldName: "Status__c", type: "text", sortable: true },
      {
        label: "Accessories",
        fieldName: "Accessories__c",
        type: "text",
        sortable: false
      },
      {
        label: "Date Purchased",
        fieldName: "Date_Purchased__c",
        type: "date-local",
        sortable: true
      },
      {
        label: "Purchase Price",
        fieldName: "Purchase_Price__c",
        type: "currency",
        sortable: true
      }
    ];
  }

  get hasRecords() {
    return Array.isArray(this.records) && this.records.length > 0;
  }

  get showTable() {
    return !this.isLoading && !this.error && this.hasRecords;
  }

  get showEmptyState() {
    return !this.isLoading && !this.error && !this.hasRecords;
  }

  get showError() {
    return !this.isLoading && Boolean(this.error);
  }

  get showRecordCount() {
    return !this.isLoading && !this.error;
  }

  @api
  handleSort(event) {
    const { fieldName, sortDirection } = event.detail;
    this.beginLoading();
    this._sortedBy = fieldName;
    this._sortFieldForApex = this.mapSortField(fieldName);
    this._sortDirection = sortDirection;
  }

  @api
  mapSortField(fieldName) {
    if (!fieldName || fieldName === "recordUrl") {
      return "Name";
    }

    return fieldName;
  }
}
