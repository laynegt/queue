import Route from '@ember/routing/route';
import RouterService from '@ember/routing/router-service';
import { service } from '@ember/service';

export default class Application extends Route {
  @service declare router: RouterService;

  redirect() {
    this.router.transitionTo('simul');
  }
}
