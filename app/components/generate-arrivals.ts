import { action } from '@ember/object';
import Component from '@glimmer/component';
import { TrackedArray } from 'tracked-built-ins';
import { randomUniform } from 'd3-random';
import { Role } from '../lib/role';

export default class GenerateArrivals extends Component {
  // TODO export these fancy
  ROLE_TANK = Role.Tank;
  ROLE_DAMAGE = Role.Damage;
  ROLE_SUPPORT = Role.Support;

  LAMBDA = 1 / 2; // every 2 minutes

  tankMean = 2;
  damageMean = 1;
  supportMean = 1.5;

  tankArrivals: TrackedArray<number> = new TrackedArray([]);
  damageArrivals: TrackedArray<number> = new TrackedArray([]);
  supportArrivals: TrackedArray<number> = new TrackedArray([]);

  madeMatch: TrackedArray<number> = new TrackedArray([]);

  /**
   * Generate an arrival
   * @param role
   * @param meanTime
   * @returns arrival time (cumulative of all arrivals in queue)
   */
  @action generate(role: Role, meanTime: number): number {
    // generate a random uniform number
    const rando = randomUniform(0, 1)();

    // x = -ln(1-U)/lambda
    //  meanTime = 1/lambda
    // convert to seconds and tack onto most recently pushed arrival
    const roleArrivals: TrackedArray<number> = this.getArrivalsForRole(role);

    const nextArrival =
      -Math.log(1 - rando) * meanTime * 60 +
      (roleArrivals.length ? <number>roleArrivals[roleArrivals.length - 1] : 0);

    roleArrivals.pushObject(nextArrival);

    return nextArrival;
  }

  /**
   * Populate n minutes worth of players in all roles.
   * Will generate arrivals including the first arrival beyond the supplied threshold
   * @param seconds
   */
  @action populate(seconds = 600) {
    // arrival loops for each role

    let recentArrival = this.tankArrivals.length
      ? <number>this.tankArrivals[this.tankArrivals.length - 1]
      : 0;
    const baseSeconds = recentArrival + seconds;

    while (recentArrival < baseSeconds) {
      recentArrival = this.generate(Role.Tank, this.tankMean);
    }

    recentArrival = this.damageArrivals.length
      ? <number>this.damageArrivals[this.damageArrivals.length - 1]
      : 0;
    while (recentArrival < baseSeconds) {
      recentArrival = this.generate(Role.Damage, this.damageMean);
    }

    recentArrival = this.supportArrivals.length
      ? <number>this.supportArrivals[this.supportArrivals.length - 1]
      : 0;
    while (recentArrival < baseSeconds) {
      recentArrival = this.generate(Role.Support, this.supportMean);
    }
  }

  /**
   * Form a match from the front of the queues and push it into
   * a class property
   */
  @action extractMatch() {
    // only proceed if we have a quorum
    if (
      this.tankArrivals.length < 2 ||
      this.damageArrivals.length < 2 ||
      this.supportArrivals.length < 2
    ) {
      return;
    }

    const matchArrivals: Array<number> = [];

    matchArrivals.push(<number>this.tankArrivals.shift());
    matchArrivals.push(<number>this.tankArrivals.shift());
    matchArrivals.push(<number>this.damageArrivals.shift());
    matchArrivals.push(<number>this.damageArrivals.shift());
    matchArrivals.push(<number>this.supportArrivals.shift());
    matchArrivals.push(<number>this.supportArrivals.shift());

    // transform the arrival times into wait times
    // 2m, 3m, 10s,    30s,    1m, 1m 40s =>
    // 1m, 0s, 2m 50s, 2m 30s, 2m, 1m 20s
    const maxArrival = Math.max(...matchArrivals);

    const waitTimes = matchArrivals.map((arrival) => {
      return maxArrival - arrival;
    });

    // clear out the previous match, I guess
    this.madeMatch.clear();
    this.madeMatch.push(...waitTimes);
  }

  @action clearQueues() {
    this.tankArrivals.clear();
    this.damageArrivals.clear();
    this.supportArrivals.clear();

    this.madeMatch.clear();
  }

  getArrivalsForRole(role: Role): TrackedArray<number> {
    switch (role) {
      case Role.Tank:
        return this.tankArrivals;
        break;
      case Role.Damage:
        return this.damageArrivals;
        break;
      case Role.Support:
        return this.supportArrivals;
        break;
      default:
        throw new Error('No arrivals for invalid role');
    }
  }

  // @action generateSome(times = 1, meanTime: number) {
  //   for (let i = 0; i < times; i++) {
  //     this.generate(meanTime);
  //   }
  // }
}
