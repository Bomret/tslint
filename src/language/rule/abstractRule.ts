/**
 * @license
 * Copyright 2013 Palantir Technologies, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as ts from "typescript";

import {doesIntersect} from "../utils";
import {IWalker} from "../walker";
import {IDisabledInterval, IOptions, IRule, IRuleMetadata, RuleFailure} from "./rule";

export abstract class AbstractRule implements IRule {
    public static metadata: IRuleMetadata;
    private options: IOptions;

    public static isRuleEnabled(ruleConfigValue: any): boolean {
        if (typeof ruleConfigValue === "boolean") {
            return ruleConfigValue;
        }

        if (Array.isArray(ruleConfigValue) && ruleConfigValue.length > 0) {
            return ruleConfigValue[0];
        }

        return false;
    }

    constructor(ruleName: string, private value: any, private disabledIntervals: IDisabledInterval[]) {
        let ruleArguments: any[] = [];

        if (Array.isArray(value) && value.length > 1) {
            ruleArguments = value.slice(1);
        }

        this.options = {
            disabledIntervals,
            ruleArguments,
            ruleName,
        };
    }

    public getOptions(): IOptions {
        return this.options;
    }

    public abstract apply(sourceFile: ts.SourceFile, languageService: ts.LanguageService): RuleFailure[];

    public applyWithWalker(walker: IWalker): RuleFailure[] {
        walker.walk(walker.getSourceFile());
        return this.filterFailures(walker.getFailures());
    }

    public isEnabled(): boolean {
        return AbstractRule.isRuleEnabled(this.value);
    }

    protected filterFailures(failures: RuleFailure[]): RuleFailure[] {
        const result: RuleFailure[] = [];
        for (const failure of failures) {
            // don't add failures for a rule if the failure intersects an interval where that rule is disabled
            if (!doesIntersect(failure, this.disabledIntervals) && !result.some((f) => f.equals(failure))) {
                result.push(failure);
            }
        }
        return result;
    }
}
