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
            const icons = {
                'Ready for Checkout': 'utility:check',
                'Checkout Pending': 'utility:add',
                'Out': 'utility:money',
                'Repair': 'utility:settings',
                'Inactive': 'utility:notification'
            };
            
            this.statuses = data.map(item => ({
                ...item,
                icon: icons[item.status] || 'utility:info'
            }));

            this.errorMessage = undefined;
        } else if (error) {
            this.statuses = [];
            this.errorMessage =
                'Unable to load equipment counts. Please try again later.';
        }
    }
}
