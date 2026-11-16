@IsTest
private class LoanHistoryControllerTest {

    private static final String EQUIPMENT_NAME = 'Test Wheelchair';
    private static final String EMPTY_EQUIPMENT_NAME = 'Unused Walker';
    private static final String OTHER_EQUIPMENT_NAME = 'Other Equipment';

    @TestSetup
    static void setup() {
        Equipment__c target = new Equipment__c(Name = EQUIPMENT_NAME, Equipment_ID__c = 'EQ-0001');
        Equipment__c empty = new Equipment__c(Name = EMPTY_EQUIPMENT_NAME, Equipment_ID__c = 'EQ-0002');
        Equipment__c other = new Equipment__c(Name = OTHER_EQUIPMENT_NAME, Equipment_ID__c = 'EQ-0003');
        insert new List<Equipment__c>{ target, empty, other };

        Id childRecordTypeId = Schema.SObjectType.Contact
            .getRecordTypeInfosByName()
            .get('Child')
            .getRecordTypeId();
        Contact child = new Contact(LastName = 'Test Child', RecordTypeId = childRecordTypeId);
        insert child;

        List<String> statuses = activeStatusValues();
        String statusA = statuses[0];
        String statusB = statuses.size() > 1 ? statuses[1] : statuses[0];

        insert new List<Equipment_Program__c>{
            program('Old',     target.Id, child.Id, Date.newInstance(2024, 1, 1),  Date.newInstance(2024, 2, 1),
statusA),
            program('Newest',  target.Id, child.Id, Date.newInstance(2026, 6, 1),  null,
statusB),
            program('Middle',  target.Id, child.Id, Date.newInstance(2025, 3, 15), Date.newInstance(2025, 4, 1),
statusA),
            program('NoFunds', target.Id, null,     null,                          null,
statusB),
            program('OtherEq', other.Id,  child.Id, Date.newInstance(2026, 9, 1),  null,
statusA)
        };
    }

    private static Equipment_Program__c program(
        String name, Id equipmentId, Id childId, Date fundsDate, Date deliveredDate, String status
    ) {
        return new Equipment_Program__c(
            Name = name,
            Equipment__c = equipmentId,
            Child_In_Need__c = childId,
            Funds_Released_Date__c = fundsDate,
            Delivered_Date__c = deliveredDate,
            Status__c = status
        );
    }

    private static List<String> activeStatusValues() {
        List<String> values = new List<String>();
        for (Schema.PicklistEntry entry : Equipment_Program__c.Status__c.getDescribe().getPicklistValues()) {
            if (entry.isActive()) {
                values.add(entry.getValue());
            }
        }
        System.assert(!values.isEmpty(), 'Status__c needs at least one active picklist value.');
        return values;
    }

    private static Id equipmentId(String name) {
        return [SELECT Id FROM Equipment__c WHERE Name = :name LIMIT 1].Id;
    }

    @IsTest
    static void returnsEquipmentHeader() {
        Id eqId = equipmentId(EQUIPMENT_NAME);

        Test.startTest();
        LoanHistoryController.LoanHistoryResult result = LoanHistoryController.getLoanHistory(eqId);
        Test.stopTest();

        Assert.areEqual(eqId, result.equipment.id);
        Assert.areEqual(EQUIPMENT_NAME, result.equipment.name);
        Assert.areEqual('EQ-0001', result.equipment.equipmentNumber);
    }

    @IsTest
    static void returnsOnlyProgramsForSelectedEquipment() {
        LoanHistoryController.LoanHistoryResult result =
            LoanHistoryController.getLoanHistory(equipmentId(EQUIPMENT_NAME));

        Assert.areEqual(4, result.rows.size(), 'Programs on other equipment must be excluded.');
        for (LoanHistoryController.LoanHistoryRow row : result.rows) {
            Assert.areNotEqual('OtherEq', row.programName);
        }
    }

    @IsTest
    static void includesEveryStatus() {
        List<String> statuses = activeStatusValues();
        LoanHistoryController.LoanHistoryResult result =
            LoanHistoryController.getLoanHistory(equipmentId(EQUIPMENT_NAME));

        Set<String> returned = new Set<String>();
        for (LoanHistoryController.LoanHistoryRow row : result.rows) {
            returned.add(row.status);
        }
        Integer expected = statuses.size() > 1 ? 2 : 1;
        Assert.areEqual(expected, returned.size(), 'Programs of every status must be returned.');
    }

    @IsTest
    static void returnsAllRecordsWithNoLimit() {
        Id eqId = equipmentId(EMPTY_EQUIPMENT_NAME);
        List<String> statuses = activeStatusValues();
        String status = statuses[0];
        List<Equipment_Program__c> bulkPrograms = new List<Equipment_Program__c>();
        for (Integer i = 0; i < 250; i++) {
            bulkPrograms.add(program('Bulk ' + i, eqId, null, Date.today().addDays(-i), null, status));
        }
        insert bulkPrograms;

        Test.startTest();
        LoanHistoryController.LoanHistoryResult result = LoanHistoryController.getLoanHistory(eqId);
        Test.stopTest();

        Assert.areEqual(250, result.rows.size(), 'Every matching record must be returned with no cap.');
    }

    @IsTest
    static void sortsNewestFirstWithBlankDatesLast() {
        LoanHistoryController.LoanHistoryResult result =
            LoanHistoryController.getLoanHistory(equipmentId(EQUIPMENT_NAME));

        List<String> order = new List<String>();
        for (LoanHistoryController.LoanHistoryRow row : result.rows) {
            order.add(row.programName);
        }
        Assert.areEqual(new List<String>{ 'Newest', 'Middle', 'Old', 'NoFunds' }, order);
        Assert.isNull(result.rows[3].fundsReleasedDate);
    }

    @IsTest
    static void mapsFieldsAndLeavesBlanksNull() {
        LoanHistoryController.LoanHistoryResult result =
            LoanHistoryController.getLoanHistory(equipmentId(EQUIPMENT_NAME));

        LoanHistoryController.LoanHistoryRow newest = result.rows[0];
        Assert.isNotNull(newest.programId);
        Assert.isNotNull(newest.childId);
        Assert.areEqual('Test Child', newest.childName);
        Assert.areEqual(Date.newInstance(2026, 6, 1), newest.fundsReleasedDate);
        Assert.isNull(newest.deliveredDate, 'A blank Delivered Date must come back null.');

        LoanHistoryController.LoanHistoryRow noFunds = result.rows[3];
        Assert.isNull(noFunds.childId, 'A blank Child lookup must come back null.');
        Assert.isNull(noFunds.childName);
    }

    @IsTest
    static void returnsStatusLabelNotApiValue() {
        Map<String, String> labelByValue = new Map<String, String>();
        for (Schema.PicklistEntry entry : Equipment_Program__c.Status__c.getDescribe().getPicklistValues()) {
            labelByValue.put(entry.getValue(), entry.getLabel());
        }
        Equipment_Program__c newest = [SELECT Status__c FROM Equipment_Program__c WHERE Name = 'Newest'];

        LoanHistoryController.LoanHistoryResult result =
            LoanHistoryController.getLoanHistory(equipmentId(EQUIPMENT_NAME));

        Assert.areEqual(labelByValue.get(newest.Status__c), result.rows[0].status);
    }

    @IsTest
    static void returnsEmptyListWhenNoPrograms() {
        LoanHistoryController.LoanHistoryResult result =
            LoanHistoryController.getLoanHistory(equipmentId(EMPTY_EQUIPMENT_NAME));

        Assert.isNotNull(result.rows);
        Assert.areEqual(0, result.rows.size());
        Assert.areEqual(EMPTY_EQUIPMENT_NAME, result.equipment.name);
    }

    @IsTest
    static void rejectsNullId() {
        assertThrows(null, 'A valid equipment record Id is required.');
    }

    @IsTest
    static void rejectsIdOfWrongObject() {
        Id contactId = [SELECT Id FROM Contact LIMIT 1].Id;
        assertThrows(contactId, 'A valid equipment record Id is required.');
    }

    @IsTest
    static void rejectsMissingOrHiddenEquipment() {
        Equipment__c eq = [SELECT Id FROM Equipment__c WHERE Name = :OTHER_EQUIPMENT_NAME];
        Id deletedId = eq.Id;
        delete [SELECT Id FROM Equipment_Program__c WHERE Equipment__c = :deletedId];
        delete eq;

        assertThrows(deletedId, 'This equipment record was not found or you do not have access to it.');
    }

    @IsTest
    static void rejectsUserWithoutObjectAccess() {
        Id eqId = equipmentId(EQUIPMENT_NAME);
        User limitedUser = minimumAccessUser();

        System.runAs(limitedUser) {
            assertThrows(eqId, 'You do not have access to view equipment loan history.');
        }
    }
    private static void assertThrows(Id eqId, String expectedMessage) {
        try {
            LoanHistoryController.getLoanHistory(eqId);
            Assert.fail('Expected an AuraHandledException with message: ' + expectedMessage);
        } catch (AuraHandledException e) {
            Assert.areEqual(
                expectedMessage,
                e.getMessage(),
                'AuraHandledException message did not match.'
            );
        } catch (Exception e) {
            Assert.fail(
                'Expected AuraHandledException but got ' + e.getTypeName() + ': ' + e.getMessage()
            );
        }

    }

    private static User minimumAccessUser() {
        Profile p = [SELECT Id FROM Profile WHERE Name = 'Minimum Access - Salesforce' LIMIT 1];
        String unique = String.valueOf(Crypto.getRandomInteger()).replace('-', '');
        User u = new User(
            ProfileId = p.Id,
            LastName = 'LoanHistoryTest',
            Alias = 'lhtest',
            Email = 'loanhistory' + unique + '@example.com',
            Username = 'loanhistory' + unique + '@example.com.test',
            EmailEncodingKey = 'UTF-8',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            TimeZoneSidKey = 'America/New_York'
        );
        insert u;
        return u;
    }
}