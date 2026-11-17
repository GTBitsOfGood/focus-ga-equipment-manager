@IsTest
private class AnnualFollowUpFormulaTest {
  // Evaluate the deployed formulas with controlled inputs. Custom metadata is
  // read-only in Apex tests, so substitute the cutoff instead of changing Rollout.
  // An empty Account supplies a typed null Date through LastActivityDate.
  private static String dateValue(Date value) {
    return value == null
      ? 'LastActivityDate'
      : 'DATE(' + value.year() + ',' + value.month() + ',' + value.day() + ')';
  }

  private static String textValue(String value) {
    return value == null ? '""' : '"' + value + '"';
  }

  private static Date dateResult(Object value) {
    if (value == null) {
      return null;
    }
    return value instanceof Datetime
      ? ((Datetime) value).dateGmt()
      : (Date) value;
  }

  private static Object evaluate(
    Schema.SObjectField field,
    Map<String, String> inputs,
    FormulaEval.FormulaReturnType returnType
  ) {
    String expression = field.getDescribe().getCalculatedFormula();
    for (String name : inputs.keySet()) {
      expression = expression.replace(name, inputs.get(name));
    }
    return Formula.builder()
      .withType(Account.SObjectType)
      .withReturnType(returnType)
      .withFormula(expression)
      .build()
      .evaluate(new Account());
  }

  private static Date nextDate(
    Date funds,
    Date cutoff,
    Date lastSent,
    String status,
    String email
  ) {
    Date cursor = dateResult(
      evaluate(
        Equipment_Program__c.Annual_Follow_Up_Cursor__c,
        new Map<String, String>{
          '$CustomMetadata.Annual_Follow_Up_Setting__mdt.Rollout.Go_Live_Date__c' => dateValue(
            cutoff
          ),
          'Last_Follow_Up_Date__c' => dateValue(lastSent)
        },
        FormulaEval.FormulaReturnType.DATE
      )
    );
    return dateResult(
      evaluate(
        Equipment_Program__c.Next_Follow_Up_Date__c,
        new Map<String, String>{
          'Annual_Follow_Up_Cursor__c' => dateValue(cursor),
          'Funds_Released_Date__c' => dateValue(funds),
          'Parent_Email__c' => textValue(email),
          'Status__c' => textValue(status)
        },
        FormulaEval.FormulaReturnType.DATE
      )
    );
  }

  private static String followUpStatus(Date nextScheduled) {
    return (String) evaluate(
      Equipment_Program__c.Annual_Follow_Up_Status__c,
      new Map<String, String>{
        'Next_Follow_Up_Date__c' => dateValue(nextScheduled)
      },
      FormulaEval.FormulaReturnType.STRING
    );
  }

  @IsTest
  static void firstEmailIsOneYearAfterFundsRelease() {
    Assert.areEqual(
      Date.newInstance(2025, 5, 15),
      nextDate(
        Date.newInstance(2024, 5, 15),
        Date.newInstance(2024, 1, 1),
        null,
        'Approved - Funds Released',
        'parent@example.com'
      )
    );
  }

  @IsTest
  static void oldProgramsSkipMissedAnniversaries() {
    Date cutoff = Date.newInstance(2026, 11, 17);
    Assert.areEqual(
      Date.newInstance(2027, 5, 15),
      nextDate(
        Date.newInstance(2024, 5, 15),
        cutoff,
        null,
        'Approved - Funds Released',
        'parent@example.com'
      )
    );
    Assert.areEqual(
      Date.newInstance(2027, 11, 17),
      nextDate(
        Date.newInstance(2024, 11, 17),
        cutoff,
        null,
        'Approved - Funds Released',
        'parent@example.com'
      )
    );
  }

  @IsTest
  static void lateSendKeepsOriginalAnniversary() {
    Assert.areEqual(
      Date.newInstance(2027, 5, 15),
      nextDate(
        Date.newInstance(2024, 5, 15),
        Date.newInstance(2025, 1, 1),
        Date.newInstance(2026, 6, 20),
        'Approved - Funds Released',
        'parent@example.com'
      )
    );
  }

  @IsTest
  static void laterSuccessfulDateAdvancesTheAnniversary() {
    Date funds = Date.newInstance(2024, 5, 15);
    Date cutoff = Date.newInstance(2025, 1, 1);
    Date previousSend = Date.newInstance(2025, 5, 15);
    Date due = nextDate(
      funds,
      cutoff,
      previousSend,
      'Approved - LE',
      'parent@example.com'
    );
    Assert.areEqual(Date.newInstance(2026, 5, 15), due);
    Assert.areEqual(
      Date.newInstance(2027, 5, 15),
      nextDate(
        funds,
        cutoff,
        Date.newInstance(2026, 5, 15),
        'Approved - LE',
        'parent@example.com'
      )
    );
  }

  @IsTest
  static void allExcludedProgramStatusesAreIneligible() {
    for (
      String status : new List<String>{
        'Equipment Returned',
        'Pending',
        'Denied',
        'Withdrawn',
        'Funds Expired'
      }
    ) {
      Date scheduled = nextDate(
        Date.newInstance(2024, 5, 15),
        Date.newInstance(2026, 1, 1),
        null,
        status,
        'parent@example.com'
      );
      Assert.isNull(scheduled, status);
      Assert.areEqual('Ineligible', followUpStatus(scheduled), status);
    }
  }

  @IsTest
  static void missingFundsEmailOrCutoffPreventsScheduling() {
    Date funds = Date.newInstance(2024, 5, 15);
    Date cutoff = Date.newInstance(2026, 1, 1);
    Assert.isNull(
      nextDate(null, cutoff, null, 'Approved - LE', 'parent@example.com')
    );
    Assert.isNull(
      nextDate(funds, null, null, 'Approved - LE', 'parent@example.com')
    );
    Assert.isNull(nextDate(funds, cutoff, null, 'Approved - LE', null));
    Assert.isNull(nextDate(funds, cutoff, null, 'Approved - LE', '   '));
  }

  @IsTest
  static void februaryAnniversariesRemainAnchored() {
    Assert.areEqual(
      Date.newInstance(2028, 2, 28),
      nextDate(
        Date.newInstance(2023, 2, 28),
        Date.newInstance(2027, 3, 1),
        null,
        'Approved - LE',
        'parent@example.com'
      )
    );
    Assert.areEqual(
      Date.newInstance(2025, 2, 28),
      nextDate(
        Date.newInstance(2024, 2, 29),
        Date.newInstance(2025, 1, 1),
        null,
        'Approved - LE',
        'parent@example.com'
      )
    );
    Assert.areEqual(
      Date.newInstance(2028, 2, 29),
      nextDate(
        Date.newInstance(2024, 2, 29),
        Date.newInstance(2027, 3, 1),
        null,
        'Approved - LE',
        'parent@example.com'
      )
    );
  }

  @IsTest
  static void statusOnlyRequiresFollowUpOnOrAfterDueDate() {
    Assert.areEqual('Up to Date', followUpStatus(Date.today().addDays(1)));
    Assert.areEqual('Follow-Up Required', followUpStatus(Date.today()));
    Assert.areEqual(
      'Follow-Up Required',
      followUpStatus(Date.today().addDays(-1))
    );
    Assert.areEqual('Ineligible', followUpStatus(null));
  }
}
