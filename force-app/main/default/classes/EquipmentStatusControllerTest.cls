@IsTest
private class EquipmentStatusControllerTest {
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
}
