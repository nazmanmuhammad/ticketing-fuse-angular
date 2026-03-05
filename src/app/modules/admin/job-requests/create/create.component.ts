import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterModule } from '@angular/router';

@Component({
    selector: 'app-create-job-request',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
    ],
    templateUrl: './create.component.html',
})
export class CreateJobRequestComponent {
    form: FormGroup;

    departments = [
        'Engineering',
        'Product',
        'Design',
        'Marketing',
        'Sales',
        'Human Resources',
        'Finance',
        'Legal',
        'Operations',
    ];

    employmentTypes = [
        { label: 'Full Time', value: 'full_time' },
        { label: 'Part Time', value: 'part_time' },
        { label: 'Contract', value: 'contract' },
        { label: 'Internship', value: 'internship' },
        { label: 'Temporary', value: 'temporary' },
    ];

    locations = [
        'New York, NY',
        'San Francisco, CA',
        'London, UK',
        'Berlin, DE',
        'Singapore, SG',
        'Remote',
    ];

    currencies = ['USD', 'EUR', 'GBP', 'SGD', 'AUD'];

    priorities = [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
        { label: 'Urgent', value: 'urgent' },
    ];

    assignees = [
        { id: 1, name: 'John Doe', avatar: 'bg-indigo-500' },
        { id: 2, name: 'Jane Smith', avatar: 'bg-green-500' },
        { id: 3, name: 'Bob Johnson', avatar: 'bg-yellow-500' },
        { id: 4, name: 'Alice Williams', avatar: 'bg-red-500' },
    ];

    constructor(private _router: Router, private _fb: FormBuilder) {
        this.form = this._fb.group({
            title: ['', Validators.required],
            department: ['', Validators.required],
            employmentType: ['full_time', Validators.required],
            location: ['', Validators.required],
            description: ['', Validators.required],
            requirements: [''],
            salaryMin: [null],
            salaryMax: [null],
            currency: ['USD'],
            isRemote: [false],
            assignedTo: [null],
            priority: ['medium'],
        });
    }

    backToJobRequests(): void {
        this._router.navigate(['/job-requests/data']);
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        console.log('Form submitted:', this.form.value);
        // Simulate API call
        setTimeout(() => {
            this._router.navigate(['/job-requests/data']);
        }, 1000);
    }
}
