import { createElement } from "lwc";
import AnnualFollowUp from "c/annualFollowUp";
import { getRecord } from "lightning/uiRecordApi";

const RECORD_ID = "a00123456789ABC";

function record(status, nextDate, lastDate) {
  return {
    apiName: "Equipment_Program__c",
    id: RECORD_ID,
    fields: {
      Annual_Follow_Up_Status__c: { value: status },
      Next_Follow_Up_Date__c: { value: nextDate },
      Last_Follow_Up_Date__c: { value: lastDate }
    }
  };
}

function mount() {
  const element = createElement("c-annual-follow-up", { is: AnnualFollowUp });
  element.recordId = RECORD_ID;
  document.body.appendChild(element);
  return element;
}

describe("c-annual-follow-up", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("shows loading while the record is being fetched", async () => {
    const element = mount();
    await Promise.resolve();
    expect(
      element.shadowRoot.querySelector('[role="status"]').textContent
    ).toContain("Loading follow-up details");
    expect(getRecord.getLastConfig().recordId).toBe(RECORD_ID);
    expect(element.shadowRoot.querySelector("dl")).toBeNull();
  });

  it("shows only status and the next and last email dates", async () => {
    const element = mount();
    getRecord.emit(record("Up to Date", "2027-05-15", "2026-05-20"));
    await Promise.resolve();

    expect(
      Array.from(element.shadowRoot.querySelectorAll("dt"), (node) =>
        node.textContent.trim()
      )
    ).toEqual([
      "Follow-Up Status",
      "Next Scheduled Email",
      "Last Successful Email"
    ]);
    expect(element.shadowRoot.querySelector("dd").textContent).toBe(
      "Up to Date"
    );
    const dates = element.shadowRoot.querySelectorAll(
      "lightning-formatted-date-time"
    );
    expect(Array.from(dates, (date) => date.value)).toEqual([
      "2027-05-15",
      "2026-05-20"
    ]);
    dates.forEach((date) => expect(date.timeZone).toBe("UTC"));
    expect(
      element.shadowRoot.querySelector("button, lightning-button")
    ).toBeNull();
    expect(element.shadowRoot.textContent).not.toMatch(
      /History|Appointment|Overseer|Start Annual/
    );
  });

  it("shows an ineligible state without hiding the last successful email", async () => {
    const element = mount();
    getRecord.emit(record("Ineligible", null, "2025-05-15"));
    await Promise.resolve();

    expect(element.shadowRoot.textContent).toContain("Ineligible");
    expect(element.shadowRoot.textContent).toContain("None scheduled");
    expect(
      element.shadowRoot.querySelector("lightning-formatted-date-time").value
    ).toBe("2025-05-15");
  });

  it("shows a clear state when no email has ever been sent", async () => {
    const element = mount();
    getRecord.emit(record("Ineligible", null, null));
    await Promise.resolve();
    expect(element.shadowRoot.textContent).toContain("No email sent yet");
    expect(
      element.shadowRoot.querySelector("lightning-formatted-date-time")
    ).toBeNull();
  });

  it("updates when refreshed record data reports a successful send", async () => {
    const element = mount();
    getRecord.emit(record("Follow-Up Required", "2026-05-15", null));
    await Promise.resolve();
    expect(element.shadowRoot.textContent).toContain("Follow-Up Required");

    getRecord.emit(record("Up to Date", "2027-05-15", "2026-05-20"));
    await Promise.resolve();
    expect(element.shadowRoot.textContent).toContain("Up to Date");
    expect(
      Array.from(
        element.shadowRoot.querySelectorAll("lightning-formatted-date-time"),
        (date) => date.value
      )
    ).toEqual(["2027-05-15", "2026-05-20"]);
  });

  it("shows an access/load error and recovers when record data arrives", async () => {
    const element = mount();
    getRecord.error();
    await Promise.resolve();
    expect(
      element.shadowRoot.querySelector('[role="alert"]').textContent
    ).toContain("Follow-up details couldn’t be loaded.");
    expect(element.shadowRoot.querySelector("dl")).toBeNull();

    getRecord.emit(record("Up to Date", "2027-05-15", null));
    await Promise.resolve();
    expect(element.shadowRoot.querySelector('[role="alert"]')).toBeNull();
    expect(element.shadowRoot.querySelector("dl")).not.toBeNull();
  });
});
