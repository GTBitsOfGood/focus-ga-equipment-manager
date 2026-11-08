public with sharing class EquipmentStatusController {

    public class StatusCount {
        @AuraEnabled public String status { get; set; }
        @AuraEnabled public String label { get; set; }
        @AuraEnabled public Integer count { get; set; }

        public StatusCount(String status, String label, Integer count) {
            this.status = status;
            this.label = label;
            this.count = count;
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<StatusCount> getStatusCounts() {

        Map<String, Integer> counts = new Map<String, Integer>{
            'Ready for Checkout' => 0,
            'Checkout Pending' => 0,
            'Out' => 0,
            'Repair' => 0,
            'Inactive' => 0
        };

        for (AggregateResult result : [
            SELECT Status__c statusValue, COUNT(Id) total
            FROM Equipment__c
            WHERE Status__c IN (
                'Ready for Checkout',
                'Checkout Pending',
                'Out',
                'Repair',
                'Inactive'
            )
            WITH USER_MODE
            GROUP BY Status__c
        ]) {
            String status = (String) result.get('statusValue');

            if (counts.containsKey(status)) {
                counts.put(
                    status,
                    (Integer) result.get('total')
                );
            }
        }

        return new List<StatusCount>{
            new StatusCount('Ready for Checkout', 'Ready for Checkout',
                counts.get('Ready for Checkout')),
            new StatusCount('Checkout Pending', 'Checkout Pending',
                counts.get('Checkout Pending')),
            new StatusCount('Out', 'Out In Community',
                counts.get('Out')),
            new StatusCount('Repair', 'Repair',
                counts.get('Repair')),
            new StatusCount('Inactive', 'Inactive',
                counts.get('Inactive'))
        };
    }
}
