import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as DinningCheck from '../lib/dinning_check-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new DinningCheck.DinningCheckStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
