import {NgModule, Component, Injectable} from '@angular/core';
import {ActivatedRoute, ActivatedRouteSnapshot, Resolve, RouterModule, RouterStateSnapshot} from "@angular/router";
import {CommonModule} from '@angular/common';

@Component({
  template: `
    <div *ngFor="let item of items">
      {{item}}
    </div>
  `
})
export class SnackListComponent {
  items: string[];
  constructor(route: ActivatedRoute) {
    this.items = route.snapshot.data['snacks'];
  }
}

export class SnackListService {
  snacks(): string[] {
    return ['snack1', 'snack2'];
  }
}

@Injectable()
export class SnackListResolver implements Resolve<any> {
  constructor(private service: SnackListService) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): any {
    return this.service.snacks();
  }
}

@NgModule({
  declarations: [SnackListComponent],
  entryComponents: [SnackListComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([{
      path: 'list',
      component: SnackListComponent,
      resolve: {
        snacks: SnackListResolver
      }
    }])
  ],
  providers: [
    SnackListResolver, SnackListService
  ]
})
export class SnackListModule {
}
