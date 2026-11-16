import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';

import NEXT_DATE from
    '@salesforce/schema/Equipment_Program__c.Next_Follow_Up_Date__c';
import LAST_DATE from
    '@salesforce/schema/Equipment_Program__c.Last_Follow_Up_Date__c';
import PROGRAM_STATUS from
    '@salesforce/schema/Equipment_Program__c.Status__c';

export default class AnnualFollowUp extends LightningElement {
    @api recordId;
    @api reminderDays = 30;

    @wire(getRecord, {
        recordId: '$recordId',
        fields: [NEXT_DATE, LAST_DATE, PROGRAM_STATUS]
    })
    program;

    get nextDate() {
        return getFieldValue(this.program?.data, NEXT_DATE);
    }

    get showUpcomingDetails() {
        return Boolean(this.nextDate)
            && !this.isReturned
            && !this.showReminder;
    }

    get lastDate() {
        return getFieldValue(this.program?.data, LAST_DATE);
    }

    get isReturned() {
        return getFieldValue(this.program?.data, PROGRAM_STATUS)
            === 'Equipment Returned';
    }

    get isLoading() {
        return !this.program?.data && !this.program?.error;
    }

    get hasError() {
        return Boolean(this.program?.error);
    }

    get daysUntilDue() {
        if (!this.nextDate) {
            return null;
        }

        const now = new Date();
        const today = Date.UTC(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );
        const due = Date.parse(`${this.nextDate}T00:00:00Z`);

        return Math.round((due - today) / 86400000);
    }

    get isDue() {
        return this.daysUntilDue !== null
            && this.daysUntilDue <= 0;
    }

    get showReminder() {
        return !this.isReturned
            && this.daysUntilDue !== null
            && this.daysUntilDue <= Number(this.reminderDays);
    }

    get reminderClass() {
        return this.isDue
            ? 'reminder reminder_due'
            : 'reminder reminder_soon';
    }

    get reminderTitle() {
        return this.isDue
            ? 'Make Check-in Appointment'
            : 'Check-in coming soon';
    }
}
