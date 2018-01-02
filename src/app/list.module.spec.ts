import {Compiler, Component, Injectable, NgModuleFactory, NgModuleFactoryLoader, Type} from '@angular/core';
import {RouterTestingModule} from '@angular/router/testing';
import {async, ComponentFixture, fakeAsync, getTestBed, TestBed, tick} from '@angular/core/testing';
import {Router} from '@angular/router';
import {SnackListComponent, SnackListModule, SnackListService} from './list.module';
import {CompileMetadataResolver} from '@angular/compiler';
import {MockResourceLoader} from '@angular/compiler/testing';

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
  beforeEach(async(() => {
    createSummaries().then(summaries => {
      resetTestEnvironmentWithSummaries(summaries);
    });
    // TestBed.configureTestingModule({
    //   providers: [
    //     { provide: NgModuleFactoryLoader, useClass: GoogleFriendlySpyNgModuleFactoryLoader}
    //   ]
    // });
  }));


  fit('should work (with lazy loading)', fakeAsync(() => {
    const list = bootstrapPage(SnackListComponent, {
      lazyLoaded: {
        'snacks': SnackListModule
      }
    }, '/snacks/list')

    expect(list.items).toEqual(['snack1', 'snack2']);
  }));

  // it('should work (without lazy loading)', fakeAsync(() => {
  //   const list = bootstrapPage(SnackListComponent, {
  //     imports: [SnackListModule]
  //   }, 'list');
  //
  //   expect(list.items).toEqual(['snack1', 'snack2']);
  // }));
});


function resetTestEnvironmentWithSummaries(summaries?: () => any[]) {
  const {platform, ngModule} = getTestBed();
  TestBed.resetTestEnvironment();
  // console.log('reset with summaries', summaries())
  TestBed.initTestEnvironment(ngModule, platform, summaries);
}

function createSummaries() {
  TestBed.configureTestingModule({imports: [SnackListModule]});
  const summariesPromise = TestBed.compileComponents().then(() => {
    const metadataResolver = TestBed.get(CompileMetadataResolver) as CompileMetadataResolver;
    const summaries = [
      metadataResolver.getNgModuleSummary(SnackListModule),
      () => [
        metadataResolver.getDirectiveSummary(SnackListComponent)
      ]
    ];
    return () => summaries;
  });

  return summariesPromise;
}

@Injectable()
export class GoogleFriendlySpyNgModuleFactoryLoader implements NgModuleFactoryLoader {
  private _stubbedModules: {[path: string]: Promise<NgModuleFactory<any>>} = {};

  set stubbedModules(modules: {[path: string]: any}) {
    // const res: {[path: string]:  any} = {};
    // for (const t of Object.keys(modules)) {
    //   const m = modules[t];
    //   const id = this.metadata.getNgModuleMetadata(m).id;
    //   try {
    //     res[t] = Promise.resolve().then(() => getModuleFactory(id));
    //   } catch (e) {
    //     res[t] = this.compiler.compileModuleAsync(modules[t]);
    //   }
    // }
    // this._stubbedModules = res;
  }

  get stubbedModules(): {[path: string]: any} { return this._stubbedModules; }

  constructor(private compiler: Compiler) {
    console.log('-----')
    console.log((compiler as any)._delegate)
  }

  // TestingCompilerImpl clearCacheFor(moduleType)
  load(path: string): Promise<NgModuleFactory<any>> {
    if (this._stubbedModules[path]) {
      return this._stubbedModules[path];
    } else {
      return <any>Promise.reject(new Error(`Cannot find module ${path}`));
    }
  }
}
