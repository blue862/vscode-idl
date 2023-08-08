import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { MaterialCssVarsModule } from 'angular-material-css-vars';

import { MaterialModule } from '../material.module';
import { EntryComponent } from './entry/entry.component';
import { ImageComponent } from './image/image.component';
import { ImageAnimatorComponent } from './image-animator/image-animator.component';
import { MapComponent } from './map/map.component';
import { Plot2DComponent } from './plot2d/plot2d.component';

@NgModule({
  declarations: [
    EntryComponent,
    ImageComponent,
    ImageAnimatorComponent,
    Plot2DComponent,
    MapComponent,
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    MaterialCssVarsModule,
    MaterialModule,
  ],
  exports: [
    EntryComponent,
    ImageComponent,
    ImageAnimatorComponent,
    Plot2DComponent,
    MapComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [],
})
export class ComponentsModule {}
