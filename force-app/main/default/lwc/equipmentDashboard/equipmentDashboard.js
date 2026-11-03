import { LightningElement, api } from "lwc";

export default class EquipmentDashboard extends LightningElement {
  _filters = {
    searchTerm: "",
    status: "",
    size: "",
    color: ""
  };

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
  }

  @api
  handleFiltersChange(event) {
    this._filters = {
      ...event.detail
    };
  }
}
