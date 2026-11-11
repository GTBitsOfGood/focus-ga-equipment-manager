@IsTest
private class EquipmentStatusControllerTest {
    private static final List<String> EXPECTED_STATUSES = new List<String>{
        'Ready for Checkout',
        'Checkout Pending',
        'Out',
        'Repair',
        'Inactive'
    };

    @IsTest
    static void returnsAllStatusesWithZeroCountsWhenNoRecordsExist() {
        Test.startTest();
        List<EquipmentStatusController.StatusCount> results =
            EquipmentStatusController.getStatusCounts();
        Integer queriesUsed = Limits.getQueries();
        Test.stopTest();

        Assert.areEqual(5, results.size());
        for (Integer i = 0; i < results.size(); i++) {
            Assert.areEqual(EXPECTED_STATUSES[i], results[i].status);
            Assert.areEqual(0, results[i].count);
        }
        Assert.areEqual('Out In Community', results[2].label);
        Assert.areEqual(1, queriesUsed, 'Counts should use one aggregate query.');
    }

    @IsTest
    static void returnsAllStatusesInStableOrderIncludingZeroCounts() {
        insert new List<Equipment__c>{
            new Equipment__c(Name = 'Ready Equipment', Status__c = 'Ready for Checkout'),
            new Equipment__c(Name = 'Out Equipment One', Status__c = 'Out'),
            new Equipment__c(Name = 'Out Equipment Two', Status__c = 'Out'),
            new Equipment__c(Name = 'Repair Equipment', Status__c = 'Repair')
        };

        Test.startTest();
        List<EquipmentStatusController.StatusCount> results =
            EquipmentStatusController.getStatusCounts();
        Test.stopTest();

        Assert.areEqual(5, results.size());
        Assert.areEqual('Ready for Checkout', results[0].status);
        Assert.areEqual(1, results[0].count);
        Assert.areEqual('Checkout Pending', results[1].status);
        Assert.areEqual(0, results[1].count);
        Assert.areEqual('Out', results[2].status);
        Assert.areEqual('Out In Community', results[2].label);
        Assert.areEqual(2, results[2].count);
        Assert.areEqual('Repair', results[3].status);
        Assert.areEqual(1, results[3].count);
        Assert.areEqual('Inactive', results[4].status);
        Assert.areEqual(0, results[4].count);
    }

    @IsTest
    static void returnsOutCountAndDisplayLabel() {
        insert new Equipment__c(Name = 'Test Equipment', Status__c = 'Out');

        Test.startTest();
        List<EquipmentStatusController.StatusCount> results =
            EquipmentStatusController.getStatusCounts();
        Test.stopTest();

        for (EquipmentStatusController.StatusCount item : results) {
            if (item.status == 'Out') {
                Assert.areEqual(1, item.count);
                Assert.areEqual('Out In Community', item.label);
            } else {
                Assert.areEqual(0, item.count);
            }
        }
    }
}
