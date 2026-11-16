public with sharing class LoanHistoryController {
      private static final String CHILD_RELATIONSHIP = 'Child_In_Need__r';

      @AuraEnabled(cacheable=true)
      public static LoanHistoryResult getLoanHistory(Id equipmentId) {
          if (equipmentId == null || equipmentId.getSObjectType() != Equipment__c.SObjectType) {
              throw auraError('A valid equipment record Id is required.');
          }
          assertReadable(Equipment__c.SObjectType);
          assertReadable(Equipment_Program__c.SObjectType);

          List<Equipment__c> equipment = (List<Equipment__c>)Security.stripInaccessible(
              AccessType.READABLE,
              [SELECT Id, Name, Equipment_ID__c
              FROM Equipment__c
              WHERE Id = :equipmentId
              LIMIT 1]
          ).getRecords();

          if (equipment.isEmpty()) {
              throw auraError('This equipment record was not found or you do not have access to it.');
          }

          List<Equipment_Program__c> programs = (List<Equipment_Program__c>)Security.stripInaccessible(
              AccessType.READABLE,
              [SELECT Id, Name,
                      Child_In_Need__c, Child_In_Need__r.Name,
                      Funds_Released_Date__c,
                      Delivered_Date__c,
                      toLabel(Status__c)
              FROM Equipment_Program__c
              WHERE Equipment__c = :equipmentId
              ORDER BY Funds_Released_Date__c DESC NULLS LAST,
              CreatedDate DESC, Id]
          ).getRecords();

          LoanHistoryResult result = new LoanHistoryResult();
          result.equipment = toHeader(equipment[0]);
          result.rows = new List<LoanHistoryRow>();
          for (Equipment_Program__c program : programs) {
              result.rows.add(toRow(program));
          }
          return result;
      }

      private static EquipmentHeader toHeader(Equipment__c rec) {
          EquipmentHeader header = new EquipmentHeader();
          header.id = rec.Id;
          header.name = (String)read(rec, 'Name');
          header.equipmentNumber = (String)read(rec, 'Equipment_ID__c');
          return header;
      }

      private static LoanHistoryRow toRow(Equipment_Program__c rec) {
          LoanHistoryRow row = new LoanHistoryRow();
          row.programId = rec.Id;
          row.programName = (String)read(rec, 'Name');
          row.childId = (Id)read(rec, 'Child_In_Need__c');
          SObject child = (SObject)read(rec, CHILD_RELATIONSHIP);
          row.childName = child == null ? null : (String)read(child, 'Name');
          row.fundsReleasedDate = (Date)read(rec, 'Funds_Released_Date__c');
          row.deliveredDate = (Date)read(rec, 'Delivered_Date__c');
          row.status = (String)read(rec, 'Status__c');
          return row;
      }

      private static Object read(SObject rec, String fieldName) {
          return rec.getPopulatedFieldsAsMap().get(fieldName);
      }

      private static void assertReadable(SObjectType objectType) {
          if (!objectType.getDescribe(SObjectDescribeOptions.DEFERRED).isAccessible()) {
              throw auraError('You do not have access to view equipment loan history.');
          }
      }

      private static AuraHandledException auraError(String message) {
          AuraHandledException e = new AuraHandledException(message);
          e.setMessage(message);
          return e;
      }
  
      public class LoanHistoryResult {
          @AuraEnabled public EquipmentHeader equipment;
          @AuraEnabled public List<LoanHistoryRow> rows;
      }

      public class EquipmentHeader {
          @AuraEnabled public Id id;
          @AuraEnabled public String name;
          @AuraEnabled public String equipmentNumber;
      }

      public class LoanHistoryRow {
          @AuraEnabled public Id programId;
          @AuraEnabled public String programName;
          @AuraEnabled public Id childId;
          @AuraEnabled public String childName;
          @AuraEnabled public Date fundsReleasedDate;
          @AuraEnabled public Date deliveredDate;
          @AuraEnabled public String status;
      }
  }