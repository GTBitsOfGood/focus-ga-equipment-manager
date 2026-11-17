import { LightningElement, api } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

export default class EquipmentDashboard extends LightningElement {
  async handleStatusChanged() {
    try {
      await this.template.querySelector("c-equipment-status-summary").refresh();
    } catch {
      this.dispatchEvent(new ShowToastEvent({
        title: "Status saved",
        message: "Unable to refresh KPI counts. Reload the dashboard to see updated counts.",
        variant: "warning"
      }));
    }
  }

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
