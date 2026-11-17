import { createElement } from "lwc";
import EquipmentStatusPicker from "c/equipmentStatusPicker";
import { getRecord, updateRecord } from "lightning/uiRecordApi";
import { getObjectInfo, getPicklistValues } from "lightning/uiObjectInfoApi";

jest.mock("lightning/uiRecordApi", () => {
  const { createLdsTestWireAdapter } = require("@salesforce/wire-service-jest-util");
  return { getRecord: createLdsTestWireAdapter(jest.fn()), updateRecord: jest.fn() };
});

const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe("c-equipment-status-picker", () => {
  afterEach(() => {
    document.body.replaceChildren();
    jest.clearAllMocks();
  });

  async function mount() {
    const element = createElement("c-equipment-status-picker", { is: EquipmentStatusPicker });
    element.recordId = "a00123456789ABC";
    element.recordName = "Wheelchair";
    element.value = "Ready for Checkout";
    document.body.appendChild(element);
    getObjectInfo.emit({ updateable: true, fields: { Status__c: { updateable: true, required: false } } });
    getRecord.emit({ recordTypeId: "012000000000000AAA", fields: { Status__c: { value: "Ready for Checkout" } } });
    await flush();
    getPicklistValues.emit({ values: [
      { label: "Ready for Checkout", value: "Ready for Checkout" },
      { label: "Out In Community", value: "Out" },
      { label: "Repair", value: "Repair" }
    ] });
    await flush();
    return { element, field: element.shadowRoot.querySelector("select") };
  }

  it("uses Salesforce labels, saves API values, and announces success only after saving", async () => {
    const { element, field } = await mount();
    expect(field.querySelector('option[value="Out"]').textContent.trim()).toBe("Out In Community");
    let complete;
    updateRecord.mockImplementation(() => new Promise((resolve) => { complete = resolve; }));
    const handler = jest.fn();
    element.addEventListener("statuschanged", handler);
    field.value = "Out";
    field.dispatchEvent(new Event("change"));
    await flush();
    expect(updateRecord).toHaveBeenCalledWith({ fields: { Id: element.recordId, Status__c: "Out" } });
    expect(field.disabled).toBe(true);
    expect(handler).not.toHaveBeenCalled();
    complete({});
    await flush();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(field.disabled).toBe(false);
    expect(element.shadowRoot.querySelector(".status-out")).not.toBeNull();
  });

  it("restores the previous selection and displays Salesforce validation errors", async () => {
    const { element, field } = await mount();
    updateRecord.mockRejectedValue({ body: { output: { fieldErrors: {
      Status__c: [{ message: "This equipment cannot be marked for repair." }]
    } } } });
    const handler = jest.fn();
    element.addEventListener("statuschanged", handler);
    field.value = "Repair";
    field.dispatchEvent(new Event("change"));
    await flush();
    expect(field.value).toBe("Ready for Checkout");
    expect(field.disabled).toBe(false);
    expect(handler).not.toHaveBeenCalled();
    expect(element.shadowRoot.querySelector('[role="alert"]').textContent).toContain("cannot be marked for repair");
  });

  it("disables editing when the user lacks field update permission", async () => {
    const { field } = await mount();
    getObjectInfo.emit({ updateable: true, fields: { Status__c: { updateable: false } } });
    await flush();
    expect(field.disabled).toBe(true);
    expect(updateRecord).not.toHaveBeenCalled();
  });
});
