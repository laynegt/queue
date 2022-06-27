import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Route | simul', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    const route = this.owner.lookup('route:simul');
    assert.ok(route);
  });
});
