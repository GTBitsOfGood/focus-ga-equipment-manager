import LightningDatatable from "lightning/datatable";
import statusPicker from "./statusPicker.html";

export default class EquipmentStatusTypes extends LightningDatatable {
  static customTypes = {
    statusPicker: {
      template: statusPicker,
      standardCellLayout: true,
      typeAttributes: ["recordId", "value", "recordName"]
    }
  };
}
