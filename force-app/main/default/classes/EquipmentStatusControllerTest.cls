
@IsTest
private class EquipmentStatusControllerTest {

    @IsTest
    static void testStatusCountsWithNoRecords() {
        Test.startTest();

        List<EquipmentStatusController.StatusCount> results =
            EquipmentStatusController.getStatusCounts();

        Integer queriesUsed = Limits.getQueries();

        Test.stopTest();

        System.assertEquals(5, results.size());

        List<String> expectedStatuses = new List<String>{
            'Ready for Checkout',
            'Checkout Pending',
            'Out',
            'Repair',
            'Inactive'
        };

        for (Integer i = 0; i < results.size(); i++) {
            System.assertEquals(
                expectedStatuses[i],
                results[i].status
            );

            System.assertEquals(0, results[i].count);
        }

        System.assertEquals(
            'Out In Community',
            results[2].label
        );

        System.assertEquals(1, queriesUsed);
    }

    @IsTest
    static void testStatusCountsWithOutRecord() {
        Equipment__c equipment = new Equipment__c(
            Name = 'Test Equipment',
            Status__c = 'Out'
        );
        insert equipment;

        Test.startTest();
        List<EquipmentStatusController.StatusCount> results =
            EquipmentStatusController.getStatusCounts();
        Test.stopTest();

        System.assertEquals(5, results.size());

        for (EquipmentStatusController.StatusCount item : results) {
            if (item.status == 'Out') {
                System.assertEquals(1, item.count);
                System.assertEquals('Out In Community', item.label);
            } else {
                System.assertEquals(0, item.count);
            }
        }
    }

}
