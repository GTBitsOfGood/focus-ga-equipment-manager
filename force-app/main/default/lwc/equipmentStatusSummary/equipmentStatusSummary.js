import { LightningElement, wire } from 'lwc';

import getStatusCounts from
    '@salesforce/apex/EquipmentStatusController.getStatusCounts';

export default class EquipmentStatusSummary
    extends LightningElement {

    statuses = [];
    isLoading = true;
    errorMessage;

    @wire(getStatusCounts)
    wiredStatusCounts({ data, error }) {
        this.isLoading = false;

        if (data) {
            this.statuses = data;
            this.errorMessage = undefined;
        } else if (error) {
            this.statuses = [];
            this.errorMessage =
                'Unable to load equipment counts. Please try again later.';
        }
    }
}
