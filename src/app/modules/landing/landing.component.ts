import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
  standalone: true,
  imports: [RouterModule],
})
export class LandingComponent {
  currentYear: number = new Date().getFullYear();

  scrollTo(id: string, event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
