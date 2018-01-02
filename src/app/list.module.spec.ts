import {Compiler, Component, getModuleFactory, Injectable, NgModuleFactory, NgModuleFactoryLoader, Type} from '@angular/core';
import {RouterTestingModule} from '@angular/router/testing';
import {ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {Router} from '@angular/router';
import {SnackListComponent, SnackListModule, SnackListService} from './list.module';
import {CompileMetadataResolver} from '@angular/compiler';

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
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: NgModuleFactoryLoader,
          useClass: GoogleFriendlySpyNgModuleFactoryLoader
        }
      ]
    });
  });

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


@Injectable()
export class GoogleFriendlySpyNgModuleFactoryLoader implements NgModuleFactoryLoader {
  private _stubbedModules: {[path: string]: Promise<NgModuleFactory<any>>} = {};

  set stubbedModules(modules: {[path: string]: any}) {
    const res: {[path: string]: any} = {};
    for (const t of Object.keys(modules)) {
      const m = modules[t];
      const id = this.metadata.getNgModuleMetadata(m).id;
      /**
       * Getting module factory by id. If doesn't work, compile it.
       */
      res[t] = Promise.resolve().then(() => getModuleFactory(id)).catch(() =>
        this.compiler.compileModuleAsync(m)
      );
    }
    this._stubbedModules = res;
  }

  get stubbedModules(): {[path: string]: any} { return this._stubbedModules; }

  load(path: string): Promise<NgModuleFactory<any>> {
    if (this._stubbedModules[path]) {
      return this._stubbedModules[path];
    } else {
      return <any>Promise.reject(new Error(`Cannot find module ${path}`));
    }
  }

  private get compiler(): Compiler {
    return TestBed.get(Compiler);
  }

  private get metadata(): CompileMetadataResolver {
    return TestBed.get(CompileMetadataResolver);
  }
}
