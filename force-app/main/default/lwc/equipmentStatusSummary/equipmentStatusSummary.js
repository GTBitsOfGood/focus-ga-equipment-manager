
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
        if (data) {
            const icons = {
                'Ready for Checkout': {
                    icon: 'utility:file',
                    iconClass: 'icon-circle icon-ready'
                },
                'Checkout Pending': {
                    icon: 'utility:add',
                    iconClass: 'icon-circle icon-pending'
                },
                'Out': {
                    icon: 'utility:money',
                    iconClass: 'icon-circle icon-out'
                },
                'Repair': {
                    icon: 'utility:copy',
                    iconClass: 'icon-circle icon-repair'
                },
                'Inactive': {
                    icon: 'utility:notification',
                    iconClass: 'icon-circle icon-inactive'
                }
            };

            this.statuses = data.map(item => ({
                ...item,
                ...(icons[item.status] || {
                    icon: 'utility:info',
                    iconClass: 'icon-circle'
                })
            }));

            this.errorMessage = undefined;
            this.isLoading = false;
        } else if (error) {
            this.statuses = [];
            this.errorMessage =
                'Unable to load equipment counts. Please try again later.';
            this.isLoading = false;
        }
    }
}
