public with sharing class EquipmentInventoryController {
    private static final Map<String, String> SORTABLE_FIELDS = new Map<String, String>{
        'name' => 'Name',
        'equipment_id__c' => 'Equipment_ID__c',
        'size__c' => 'Size__c',
        'status__c' => 'Status__c',
        'color__c' => 'Color__c',
        'date_purchased__c' => 'Date_Purchased__c',
        'purchase_price__c' => 'Purchase_Price__c'
    };
    private static final String FIELDS =
        'Id, Name, Equipment_ID__c, Size__c, Color__c, Status__c,' + 
        'Accessories__c, Date_Purchased__c, Purchase_Price__c';
    public class EquipmentPage {
        @AuraEnabled public List<Equipment__c> records;
        @AuraEnabled public Integer totalCount; 
    }
    @AuraEnabled(cacheable=true)
    public static EquipmentPage getEquipmentRecords(
        String searchTerm, String status, String size, String color,
        String sortBy, String sortDirection, Integer pageSize, Integer pageNumber
    ) {
        Map<String, Object> binds = new Map<String, Object>();
        List<String> conditions = new List<String>();

        if (String.isNotBlank(searchTerm)) {
            binds.put('searchKey', '%' + escapeLike(searchTerm.trim()) + '%');
            conditions.add('(Name LIKE :searchKey OR Equipment_ID__C LIKE :searchKey)');
        }
        if (String.isNotBlank(status)) {
            binds.put('status', status);
            conditions.add('Status__c = :status');
        }
        if (String.isNotBlank(size)) {
            binds.put('size', size);
            conditions.add('Size__c = :size');
        }
        if (String.isNotBlank(color)) {
            binds.put('color', color);
            conditions.add('Color__c = :color');
        }
        String whereClause = conditions.isEmpty() ? '' : ' WHERE ' + String.join(conditions, ' AND ');
        String field = SORTABLE_FIELDS.get(sortBy == null ? '' : sortBy.tolowercase());
        if (field == null) {
            field = 'Name';
        }
        String dir = 'desc'.equalsIgnoreCase(sortDirection) ? 'DESC' : 'ASC';
        String orderBy = ' ORDER BY ' + field + ' ' + dir + ' NULLS LAST, Id ' + dir;
        String soql = 'SELECT ' + FIELDS + ' FROM Equipment__c' + whereClause + orderBy;
        if (pageSize != null && pageSize > 0) {
            Integer safeSize = Math.min(pageSize, 200);
            Integer page = (pageNumber == null || pageNumber < 1) ? 1 : pageNumber;
            binds.put('lim', safeSize);
            binds.put('off', Math.min((page - 1) * safeSize, 2000));
            soql += ' LIMIT :lim OFFSET :off';
        }
        EquipmentPage result = new EquipmentPage();
        result.records = Database.queryWithBinds(soql, binds, AccessLevel.USER_MODE);
        result.totalCount = Database.countQueryWithBinds(
            'SELECT COUNT() FROM Equipment__c' + whereClause, binds, AccessLevel.USER_MODE);
        return result;
    }
    private static String escapeLike(String s) {
        return s.replace('\\', '\\\\').replace('%', '\\%').replace('_', '\\_');
    }
}