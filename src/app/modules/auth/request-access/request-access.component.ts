import { Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'auth-request-access',
    templateUrl: './request-access.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    standalone: true,
    imports: [
        RouterModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatCheckboxModule,
        MatFormFieldModule,
        MatInputModule,
        MatProgressSpinnerModule,
        CommonModule,
    ],
})
export class AuthRequestAccessComponent implements OnInit {
    alert: {
        type: FuseAlertType;
        message: string;
    } = {
        type: 'success',
        message: '',
    };
    requestAccessForm: UntypedFormGroup;
    showAlert: boolean = false;
    currentYear: number = new Date().getFullYear();

    private _authService = inject(AuthService);
    private _formBuilder = inject(UntypedFormBuilder);
    private _router = inject(Router);

    ngOnInit(): void {
        this.requestAccessForm = this._formBuilder.group({
            name: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
        });
    }

    requestAccess(): void {
        if (this.requestAccessForm.invalid) {
            return;
        }

        this.requestAccessForm.disable();
        this.showAlert = false;

        this._authService.requestAccess(this.requestAccessForm.value).subscribe(
            () => {
                this._router.navigateByUrl('/confirmation-required');
            },
            (response) => {
                this.requestAccessForm.enable();
                this.requestAccessForm.reset();
                this.alert = {
                    type: 'error',
                    message: response.error.message,
                };
                this.showAlert = true;
            }
        );
    }
}
