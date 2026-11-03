import { createElement } from "lwc";
import EquipmentInventoryTable from "c/equipmentInventoryTable";
import getEquipmentRecords from "@salesforce/apex/EquipmentInventoryController.getEquipmentRecords";

describe("c-equipment-inventory-table", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("shows a loading state and then renders successful records from the Apex wire adapter", async () => {
    const element = createElement("c-equipment-inventory-table", {
      is: EquipmentInventoryTable
    });

    document.body.appendChild(element);
    await Promise.resolve();
    expect(
      element.shadowRoot.querySelector("lightning-spinner")
    ).not.toBeNull();

    getEquipmentRecords.emit({
      records: [
        {
          Id: "a00123456789ABC",
          Name: "Wheelchair",
          Equipment_ID__c: "EQ-1001",
          Size__c: "Large",
          Color__c: "Blue",
          Status__c: "Available",
          Accessories__c: "Cup Holder",
          Date_Purchased__c: "2024-01-15",
          Purchase_Price__c: 250.0
        },
        {
          Id: "a00123456789DEF",
          Name: "Crib",
          Equipment_ID__c: "EQ-1002",
          Size__c: "Medium",
          Color__c: "Red",
          Status__c: "Checked Out",
          Accessories__c: "Mattress",
          Date_Purchased__c: "2024-02-10",
          Purchase_Price__c: 420.0
        }
      ],
      totalCount: 2
    });
    await Promise.resolve();

    const datatable = element.shadowRoot.querySelector("lightning-datatable");
    expect(datatable).not.toBeNull();
    expect(datatable.data).toHaveLength(2);
    expect(datatable.data[0].Name).toBe("Wheelchair");
    expect(datatable.data[0].recordUrl).toBe(
      "/lightning/r/Equipment__c/a00123456789ABC/view"
    );
    expect(element.totalCount).toBe(2);
    expect(element.shadowRoot.querySelector(".slds-theme_error")).toBeNull();
  });

  it("shows the empty state when the Apex wire returns zero records", async () => {
    const element = createElement("c-equipment-inventory-table", {
      is: EquipmentInventoryTable
    });

    document.body.appendChild(element);
    await Promise.resolve();

    getEquipmentRecords.emit({
      records: [],
      totalCount: 0
    });
    await Promise.resolve();

    const emptyBox = element.shadowRoot.querySelector(".slds-box");
    expect(emptyBox).not.toBeNull();
    expect(emptyBox.textContent).toContain(
      "No equipment records match the selected filters."
    );
    expect(element.shadowRoot.querySelector("lightning-datatable")).toBeNull();
  });

  it("shows an error state when the Apex wire fails and applies sorting metadata correctly", async () => {
    const element = createElement("c-equipment-inventory-table", {
      is: EquipmentInventoryTable
    });

    document.body.appendChild(element);
    await Promise.resolve();

    getEquipmentRecords.emitError({
      body: { message: "Failed to load data" },
      status: 500,
      statusText: "Server Error"
    });
    await Promise.resolve();

    const alert = element.shadowRoot.querySelector(".slds-theme_error");
    expect(alert).not.toBeNull();
    expect(alert.textContent).toContain(
      "Unable to load equipment records right now. Please try again."
    );

    element.handleSort({
      detail: {
        fieldName: "recordUrl",
        sortDirection: "desc"
      }
    });

    expect(element.sortedBy).toBe("recordUrl");
    expect(element.sortFieldForApex).toBe("Name");
    expect(element.sortDirection).toBe("desc");
    expect(element.mapSortField("recordUrl")).toBe("Name");
  });
});
