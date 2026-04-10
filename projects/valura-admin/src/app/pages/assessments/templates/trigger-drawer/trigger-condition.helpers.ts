import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { RuleBuilderService } from '@admin-core/services/template/rule-builder/rule-builder.service';

export function createConditionGroup(fb: FormBuilder, questionId: string | undefined): FormGroup {
  return fb.group({
    questionId: [questionId],
    operator: [''],
    value: [''],
    valueTo: [''],
    logic: ['']
  });
}

export function addConditionBlock(
  blocks: FormArray,
  connectors: FormArray,
  fb: FormBuilder,
  questionId: string | undefined
): void {
  blocks.push(
    fb.group({
      type: 'condition',
      questionId: questionId,
      operator: '',
      value: '',
      valueTo: '',
      logic: null
    })
  );

  if (blocks.length > 1) {
    const firstValue = connectors.length > 0 ? connectors.at(0).value : 'AND';
    connectors.push(fb.control(firstValue));
    updateConnectorStates(connectors);
  }
}

export function addGroupBlock(
  blocks: FormArray,
  connectors: FormArray,
  fb: FormBuilder,
  questionId: string | undefined
): void {
  blocks.push(
    fb.group({
      type: 'group',
      groupLogic: 'AND',
      conditions: fb.array([createConditionGroup(fb, questionId)])
    })
  );

  if (blocks.length > 1) {
    const firstValue = connectors.length > 0 ? connectors.at(0).value : 'AND';
    connectors.push(fb.control(firstValue));
    updateConnectorStates(connectors);
  }
}

export function removeBlock(blocks: FormArray, connectors: FormArray, index: number): void {
  blocks.removeAt(index);

  if (connectors.length > 0) {
    if (index < connectors.length) {
      connectors.removeAt(index);
    } else {
      connectors.removeAt(connectors.length - 1);
    }
  }
  updateConnectorStates(connectors);
}

export function addConditionToGroupAt(
  blocks: FormArray,
  fb: FormBuilder,
  index: number,
  questionId: string | undefined
): void {
  const group = blocks.at(index);
  (group.get('conditions') as FormArray).push(createConditionGroup(fb, questionId));
}

export function removeConditionFromGroupAt(
  blocks: FormArray,
  groupIndex: number,
  condIndex: number
): void {
  const group = blocks.at(groupIndex);
  const conditions = group.get('conditions') as FormArray;

  conditions.removeAt(condIndex);
  if (conditions.length <= 1) {
    group.patchValue({ groupLogic: null });
  }
}

export function updateConnectorStates(connectors: FormArray): void {
  connectors.controls.forEach((control, index) => {
    if (index === 0) {
      control.enable({ emitEvent: false });
    } else {
      control.disable({ emitEvent: false });
    }
  });
}

export function generateExpression(blocks: FormArray, connectors: FormArray): string {
  let exp = '';
  let globalIndex = 0;

  blocks.controls.forEach((block, bi) => {
    if (block.value.type === 'condition') {
      globalIndex++;
      exp += `C${globalIndex}`;
    } else if (block.value.type === 'group') {
      const conditions = block.get('conditions') as FormArray;
      let groupExp = '';

      conditions.controls.forEach((_, ci) => {
        globalIndex++;
        groupExp += `C${globalIndex}`;

        if (ci < conditions.length - 1 && block.value.groupLogic) {
          groupExp += ` ${block.value.groupLogic} `;
        }
      });

      exp += `(${groupExp})`;
    }

    if (bi < connectors.length) {
      exp += ` ${connectors.at(bi).value} `;
    }
  });

  return exp;
}

export function getGlobalConditionNumber(
  blocks: FormArray,
  blockIndex: number,
  conditionIndex?: number
): number {
  let count = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks.at(i);

    if (block.value.type === 'condition') {
      count++;
      if (i === blockIndex && conditionIndex === undefined) {
        return count;
      }
    }

    if (block.value.type === 'group') {
      const conditions = block.get('conditions') as FormArray;
      for (let j = 0; j < conditions.length; j++) {
        count++;
        if (i === blockIndex && j === conditionIndex) {
          return count;
        }
      }
    }
  }

  return count;
}

export function buildConditions(
  blocks: FormArray,
  connectors: FormArray,
  ruleBuilderService: RuleBuilderService
): any {
  const rules: any[] = [];

  blocks.controls.forEach((block) => {
    if (block.value.type === 'condition') {
      rules.push(ruleBuilderService.buildRule(block.value));
    }

    if (block.value.type === 'group') {
      const groupConditions = block.get('conditions') as FormArray;
      const groupRules = groupConditions.controls.map(c =>
        ruleBuilderService.buildRule(c.value)
      );
      if (groupRules.length === 1) {
        rules.push(groupRules[0]);
      } else {
        rules.push({
          logic: block.value.groupLogic,
          rules: groupRules
        });
      }
    }
  });

  if (rules.length === 0) return;
  if (rules.length === 1) return rules[0];

  return {
    logic: connectors.length ? connectors.at(0).value || 'AND' : 'AND',
    rules
  };
}

export function parseConditionsIntoForm(
  condition: any,
  blocks: FormArray,
  connectors: FormArray,
  fb: FormBuilder,
  questionId: string | undefined
): void {
  blocks.clear();
  connectors.clear();

  if (!condition) return;

  if (!condition.rules) {
    blocks.push(
      fb.group({
        type: ['condition'],
        questionId: [condition.questionId || questionId],
        operator: [condition.operator || ''],
        value: [condition.value ?? ''],
        valueTo: [condition.valueTo ?? ''],
        logic: [null]
      })
    );
    return;
  }

  condition.rules.forEach((r: any, index: number) => {
    if (r.rules) {
      blocks.push(
        fb.group({
          type: ['group'],
          groupLogic: [r.logic],
          conditions: fb.array(
            r.rules.map((c: any) =>
              fb.group({
                questionId: [c.questionId || questionId],
                operator: [c.operator || ''],
                value: [c.value ?? ''],
                valueTo: [c.valueTo ?? ''],
                logic: [null]
              })
            )
          )
        })
      );
    } else {
      blocks.push(
        fb.group({
          type: ['condition'],
          questionId: [r.questionId || questionId],
          operator: [r.operator || ''],
          value: [r.value ?? ''],
          valueTo: [r.valueTo ?? ''],
          logic: [null]
        })
      );
    }

    if (index < condition.rules.length - 1) {
      connectors.push(fb.control(condition.logic || 'AND'));
    }
  });

  updateConnectorStates(connectors);
}

export function getConnectorControl(connectors: FormArray, index: number): FormControl {
  return connectors.at(index) as FormControl;
}
