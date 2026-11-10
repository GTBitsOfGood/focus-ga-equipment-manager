/**
 * This class contains unit tests for validating the behavior of Apex classes
 * and triggers.
 *
 * Unit tests are class methods that verify whether a particular piece
 * of code is working properly. Unit test methods take no arguments,
 * commit no data to the database, and are flagged with the testMethod
 * keyword in the method definition.
 *
 * All test methods in an org are executed whenever Apex code is deployed
 * to a production org to confirm correctness, ensure code
 * coverage, and prevent regressions. All Apex classes are
 * required to have at least 75% code coverage in order to be deployed
 * to a production org. In addition, all triggers must have some code coverage.
 *
 * The @isTest class annotation indicates this class only contains test
 * methods. Classes defined with the @isTest annotation do not count against
 * the org size limit for all Apex scripts.
 *
 * See the Apex Language Reference for more information about Testing and Code Coverage.
 */
@isTest
private class EquipmentInventoryControllerTest {

    @TestSetup
    static void setup(){
        insert new List<Equipment__c>{
            new Equipment__c(Name = 'Kendeda Wheelchair', Equipment_ID__c = '1', Status__c = 'Ready for Checkout', Size__c = 14, Color__c = 'Red',  Purchase_Price__c = 100),
            new Equipment__c(Name = 'Klaus Stroller', Equipment_ID__c = '2', Status__c = 'Out', Size__c = 20, Color__c = 'Blue', Purchase_Price__c = 300),
            new Equipment__c(Name = 'Scheller Mobility Scooter', Equipment_ID__c = '3', Status__c = 'Repair', Size__c = 12, Color__c = 'Green', Purchase_Price__c = 200),
            new Equipment__c(Name = 'Gilbert Beach Wheelchair', Equipment_ID__c = '4', Status__c = 'Out', Size__c = 18, Color__c = 'Black', Purchase_Price__c = 400),
            new Equipment__c(Name = 'Lewis Looper', Equipment_ID__c = '5', Status__c = 'Ready for Checkout', Size__c = 12, Color__c = 'White',  Purchase_Price__c = 50)
        };
    }

    private static EquipmentInventoryController.EquipmentPage run(
        String search, String status, String size, String color,
        String sortBy, String dir, Integer pageSize, Integer pageNum) {
        return EquipmentInventoryController.getEquipmentRecords(
            search, status, size, color, sortBy, dir, pageSize, pageNum);
    }

    @isTest static void returnsAllWithNoFilters() {
        EquipmentInventoryController.EquipmentPage p = run(
            null, null, null, null,
            null, null, null, null
        );
        Assert.areEqual(5, p.records.size());
        Assert.areEqual(5, p.totalCount);
    }

    @isTest static void searchByExactName() {
        EquipmentInventoryController.EquipmentPage p = run(
            'Klaus Stroller', null, null, null,
            null, null, null, null
        );
        Assert.areEqual('Klaus Stroller', p.records[0].Name);
    }

    @isTest static void searchByLikeName() {
        EquipmentInventoryController.EquipmentPage p = run(
            'Wheelchair', null, null, null,
            null, null, null, null
        );
        Assert.areEqual(2, p.totalCount);
        Assert.areEqual('Gilbert Beach Wheelchair', p.records[0].Name);
        Assert.areEqual('Kendeda Wheelchair', p.records[1].Name);
    }

    @isTest static void searchesByEquipmentId() {
        Equipment__c e = [SELECT Equipment_ID__c FROM Equipment__c WHERE Name = 'Lewis Looper'];
        EquipmentInventoryController.EquipmentPage p = run(e.Equipment_ID__c, null, null, null, null, null, null, null);
        Assert.areEqual(1, p.totalCount);
        Assert.areEqual('Lewis Looper', p.records[0].Name);
    }

    @isTest static void filtersWorkTogether() {
        Assert.areEqual(2, run(null, 'Ready for Checkout', null, null, null, null, null, null).totalCount);
        EquipmentInventoryController.EquipmentPage p = run(null, 'Ready for Checkout', null, 'White', null, null, null, null);
        Assert.areEqual(1, p.totalCount);
        Assert.areEqual('Lewis Looper', p.records[0].Name);
    }

    @isTest static void sortByDescendingName() {
        EquipmentInventoryController.EquipmentPage p = run(
            null, null, null, null,
            'name', 'DESC', null, null
        );
        Assert.areEqual('Scheller Mobility Scooter', p.records[0].Name);
        Assert.areEqual('Gilbert Beach Wheelchair', p.records[4].Name);
    }

    @isTest static void sortByAscendingPrice() {
        EquipmentInventoryController.EquipmentPage p = run(
            null, null, null, null,
            'purchase_price__c', 'ASC', null, null
        );
        Assert.areEqual('Lewis Looper', p.records[0].Name);
        Assert.areEqual('Gilbert Beach Wheelchair', p.records[4].Name);
    }

    @isTest static void invalidSortParameters() {
        EquipmentInventoryController.EquipmentPage p = run(
            null, null, null, null,
            'size__c; DELETE', 'ASC, Hello World', null, null
        );
        Assert.areEqual('Gilbert Beach Wheelchair', p.records[0].Name);
    }

    @isTest static void searchInputIsNotInjectable() {
        EquipmentInventoryController.EquipmentPage p = run('\' OR Name != \'', null, null, null, null, null, null, null);
        Assert.areEqual(0, p.totalCount);
    }

    @isTest static void paginates() {
        EquipmentInventoryController.EquipmentPage p = run(null, null, null, null, null, null, 3, 2);
        Assert.areEqual(2, p.records.size());
        Assert.areEqual(5, p.totalCount);
    }

    // ---- User mode ----
    private static User makeUser(Boolean withPermSet) {
        Profile prof = [SELECT Id FROM Profile WHERE Name = 'Minimum Access - Salesforce' LIMIT 1];
        String uniq = String.valueOf(Math.abs(Crypto.getRandomInteger()));
        User u = new User(Alias = 'eqtest', LastName = 'Tester', ProfileId = prof.Id,
            Email = 'eq' + uniq + '@example.com', Username = 'eq' + uniq + '@example.com.test',
            TimeZoneSidKey = 'America/New_York', LocaleSidKey = 'en_US',
            EmailEncodingKey = 'UTF-8', LanguageLocaleKey = 'en_US');
        insert u;
        if (withPermSet) {
            PermissionSet ps = [SELECT Id FROM PermissionSet WHERE Name = 'Equipment_Manager'];
            insert new PermissionSetAssignment(AssigneeId = u.Id, PermissionSetId = ps.Id);
        }
        return u;
    }

    @isTest static void equipmentManagerCanQuery() {
        System.runAs(makeUser(true)) {
            EquipmentInventoryController.EquipmentPage p = run(null, null, null, null, null, null, null, null);
            Assert.areEqual(p.totalCount, p.records.size());
        }
    }

    @isTest static void userWithoutAccessIsBlocked() {
        System.runAs(makeUser(false)) {
            try {
                run(null, null, null, null, null, null, null, null);
                Assert.fail('Expected user mode to block access');
            } catch (Exception e) {
                // Expected: user mode refused the query
            }
        }
    }
}
