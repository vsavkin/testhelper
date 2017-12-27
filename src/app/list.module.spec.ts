import {Component, NgModuleFactoryLoader, Type} from '@angular/core';
import {RouterTestingModule} from '@angular/router/testing';
import {ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {Router} from '@angular/router';
import {SnackListComponent, SnackListModule, SnackListService} from './list.module';

export function bootstrapPage<T>(component: Type<T>, config: any, initialUrl: string = ''): T {
  @Component({
    selector: 'container',
    template: `
      Container
      <router-outlet></router-outlet>`
  })
  class Container {
  }

  const routes = [];

  if (config.lazyLoaded) {
    Object.keys(config.lazyLoaded).forEach(k => {
      routes.push({
        path: k,
        loadChildren: k
      });
    });
  }

  config.imports = [...(config.imports || []), RouterTestingModule.withRoutes(routes)];
  config.declarations = [...(config.declarations || []), Container];

  TestBed.configureTestingModule(config);

  if (config.lazyLoaded) {
    const loader = TestBed.get(NgModuleFactoryLoader);
    loader.stubbedModules = config.lazyLoaded;
  }

  const router: Router = TestBed.get(Router);
  const c = createRoot(router, Container);
  router.navigateByUrl(initialUrl).catch(e => {
    throw e;
  });
  advance(c);

  return c.debugElement.query(c => {
    return c.componentInstance instanceof component
  }).componentInstance;
}

function createRoot(router: Router, type: any): ComponentFixture<any> {
  const f = TestBed.createComponent(type);
  advance(f);
  router.initialNavigation();
  advance(f);
  return f;
}

function advance(fixture: ComponentFixture<any>): void {
  tick();
  fixture.detectChanges();
}


fdescribe('ListModule', () => {
  it('should work (with lazy loading)', fakeAsync(() => {
    const list = bootstrapPage(SnackListComponent, {
      lazyLoaded: {
        'snacks': SnackListModule
      }
    }, '/snacks/list');

    expect(list.items).toEqual(['snack1', 'snack2']);
  }));

  it('should work (without lazy loading)', fakeAsync(() => {
    const list = bootstrapPage(SnackListComponent, {
      imports: [SnackListModule]
    }, 'list');

    expect(list.items).toEqual(['snack1', 'snack2']);
  }));
});
