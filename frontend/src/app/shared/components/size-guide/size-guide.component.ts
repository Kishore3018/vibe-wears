import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-size-guide',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('fadeIn', [
      state('void', style({ opacity: 0 })),
      state('*', style({ opacity: 1 })),
      transition('void => *', animate('300ms ease-out')),
      transition('* => void', animate('200ms ease-in'))
    ]),
    trigger('slideUp', [
      state('void', style({ transform: 'translateY(30px)', opacity: 0 })),
      state('*', style({ transform: 'translateY(0)', opacity: 1 })),
      transition('void => *', animate('400ms ease-out')),
      transition('* => void', animate('200ms ease-in'))
    ])
  ],
  template: `
    @if (isOpen) {
      <div class="modal-overlay" [@fadeIn] (click)="close()">
        <div class="modal-container" [@slideUp] (click)="$event.stopPropagation()">
          <button class="close-btn" (click)="close()">
            <span class="material-icons">close</span>
          </button>

          <div class="modal-header">
            <h2>Size Guide</h2>
            <p>Find your perfect fit with our comprehensive size chart</p>
          </div>

          <!-- Category Tabs -->
          <div class="category-tabs">
            <button 
              class="tab" 
              [class.active]="activeCategory() === 'shirts'"
              (click)="setCategory('shirts')"
            >
              <span class="material-icons">checkroom</span>
              Shirts
            </button>
            <button 
              class="tab" 
              [class.active]="activeCategory() === 'tshirts'"
              (click)="setCategory('tshirts')"
            >
              <span class="material-icons">dry_cleaning</span>
              T-Shirts
            </button>
            <button 
              class="tab" 
              [class.active]="activeCategory() === 'pants'"
              (click)="setCategory('pants')"
            >
              <span class="material-icons">straighten</span>
              Pants/Jeans
            </button>
            <button 
              class="tab" 
              [class.active]="activeCategory() === 'suits'"
              (click)="setCategory('suits')"
            >
              <span class="material-icons">business_center</span>
              Suits
            </button>
          </div>

          <!-- Size Tables -->
          <div class="size-content">
            @switch (activeCategory()) {
              @case ('shirts') {
                <div class="size-table-wrapper">
                  <table class="size-table">
                    <thead>
                      <tr>
                        <th>Size</th>
                        <th>Chest (inches)</th>
                        <th>Neck (inches)</th>
                        <th>Sleeve (inches)</th>
                        <th>Length (inches)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td class="size-label">S</td>
                        <td>36-38</td>
                        <td>14-14.5</td>
                        <td>32-33</td>
                        <td>27-28</td>
                      </tr>
                      <tr>
                        <td class="size-label">M</td>
                        <td>39-41</td>
                        <td>15-15.5</td>
                        <td>33-34</td>
                        <td>28-29</td>
                      </tr>
                      <tr>
                        <td class="size-label">L</td>
                        <td>42-44</td>
                        <td>16-16.5</td>
                        <td>34-35</td>
                        <td>29-30</td>
                      </tr>
                      <tr>
                        <td class="size-label">XL</td>
                        <td>45-47</td>
                        <td>17-17.5</td>
                        <td>35-36</td>
                        <td>30-31</td>
                      </tr>
                      <tr>
                        <td class="size-label">XXL</td>
                        <td>48-50</td>
                        <td>18-18.5</td>
                        <td>36-37</td>
                        <td>31-32</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              }
              @case ('tshirts') {
                <div class="size-table-wrapper">
                  <table class="size-table">
                    <thead>
                      <tr>
                        <th>Size</th>
                        <th>Chest (inches)</th>
                        <th>Shoulder (inches)</th>
                        <th>Length (inches)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td class="size-label">S</td>
                        <td>36-38</td>
                        <td>16-17</td>
                        <td>27</td>
                      </tr>
                      <tr>
                        <td class="size-label">M</td>
                        <td>39-41</td>
                        <td>17-18</td>
                        <td>28</td>
                      </tr>
                      <tr>
                        <td class="size-label">L</td>
                        <td>42-44</td>
                        <td>18-19</td>
                        <td>29</td>
                      </tr>
                      <tr>
                        <td class="size-label">XL</td>
                        <td>45-47</td>
                        <td>19-20</td>
                        <td>30</td>
                      </tr>
                      <tr>
                        <td class="size-label">XXL</td>
                        <td>48-50</td>
                        <td>20-21</td>
                        <td>31</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              }
              @case ('pants') {
                <div class="size-table-wrapper">
                  <table class="size-table">
                    <thead>
                      <tr>
                        <th>Size</th>
                        <th>Waist (inches)</th>
                        <th>Inseam (inches)</th>
                        <th>Hip (inches)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td class="size-label">28</td>
                        <td>28-29</td>
                        <td>30-32</td>
                        <td>36-37</td>
                      </tr>
                      <tr>
                        <td class="size-label">30</td>
                        <td>30-31</td>
                        <td>30-32</td>
                        <td>38-39</td>
                      </tr>
                      <tr>
                        <td class="size-label">32</td>
                        <td>32-33</td>
                        <td>30-32</td>
                        <td>40-41</td>
                      </tr>
                      <tr>
                        <td class="size-label">34</td>
                        <td>34-35</td>
                        <td>30-32</td>
                        <td>42-43</td>
                      </tr>
                      <tr>
                        <td class="size-label">36</td>
                        <td>36-37</td>
                        <td>30-32</td>
                        <td>44-45</td>
                      </tr>
                      <tr>
                        <td class="size-label">38</td>
                        <td>38-39</td>
                        <td>30-32</td>
                        <td>46-47</td>
                      </tr>
                      <tr>
                        <td class="size-label">40</td>
                        <td>40-41</td>
                        <td>30-32</td>
                        <td>48-49</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              }
              @case ('suits') {
                <div class="size-table-wrapper">
                  <table class="size-table">
                    <thead>
                      <tr>
                        <th>Size</th>
                        <th>Chest (inches)</th>
                        <th>Waist (inches)</th>
                        <th>Shoulder (inches)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td class="size-label">36</td>
                        <td>36</td>
                        <td>30</td>
                        <td>17</td>
                      </tr>
                      <tr>
                        <td class="size-label">38</td>
                        <td>38</td>
                        <td>32</td>
                        <td>17.5</td>
                      </tr>
                      <tr>
                        <td class="size-label">40</td>
                        <td>40</td>
                        <td>34</td>
                        <td>18</td>
                      </tr>
                      <tr>
                        <td class="size-label">42</td>
                        <td>42</td>
                        <td>36</td>
                        <td>18.5</td>
                      </tr>
                      <tr>
                        <td class="size-label">44</td>
                        <td>44</td>
                        <td>38</td>
                        <td>19</td>
                      </tr>
                      <tr>
                        <td class="size-label">46</td>
                        <td>46</td>
                        <td>40</td>
                        <td>19.5</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              }
            }
          </div>

          <!-- Measurement Tips -->
          <div class="measurement-tips">
            <h3>
              <span class="material-icons">tips_and_updates</span>
              How to Measure
            </h3>
            <div class="tips-grid">
              <div class="tip">
                <span class="tip-icon">📏</span>
                <div>
                  <strong>Chest</strong>
                  <p>Measure around the fullest part of your chest, keeping the tape horizontal.</p>
                </div>
              </div>
              <div class="tip">
                <span class="tip-icon">👔</span>
                <div>
                  <strong>Neck</strong>
                  <p>Measure around the base of your neck where a collar would sit.</p>
                </div>
              </div>
              <div class="tip">
                <span class="tip-icon">📐</span>
                <div>
                  <strong>Waist</strong>
                  <p>Measure around your natural waistline, typically at the belly button.</p>
                </div>
              </div>
              <div class="tip">
                <span class="tip-icon">🦵</span>
                <div>
                  <strong>Inseam</strong>
                  <p>Measure from the crotch to the bottom of your ankle bone.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Fit Recommendation -->
          <div class="fit-note">
            <span class="material-icons">info</span>
            <p>If you're between sizes, we recommend sizing up for a more comfortable fit. Our garments are designed with a modern, slightly relaxed silhouette.</p>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(10px);
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      overflow-y: auto;
    }

    .modal-container {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 24px;
      max-width: 900px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
      box-shadow: 0 25px 100px rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(201, 169, 98, 0.2);
      padding: 2rem;
    }

    .close-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      background: rgba(255, 255, 255, 0.1);
      border: none;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255, 255, 255, 0.7);
      transition: all 0.3s ease;
      z-index: 10;

      &:hover {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        transform: rotate(90deg);
      }
    }

    .modal-header {
      text-align: center;
      margin-bottom: 2rem;

      h2 {
        font-size: 1.75rem;
        font-weight: 700;
        color: white;
        margin: 0 0 0.5rem 0;
      }

      p {
        color: rgba(255, 255, 255, 0.6);
        margin: 0;
      }
    }

    .category-tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 2rem;
      overflow-x: auto;
      padding-bottom: 0.5rem;
    }

    .tab {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.05);
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      transition: all 0.3s ease;
      white-space: nowrap;

      .material-icons {
        font-size: 20px;
      }

      &:hover {
        border-color: rgba(201, 169, 98, 0.3);
        color: white;
      }

      &.active {
        background: linear-gradient(135deg, #c9a962 0%, #a08347 100%);
        border-color: transparent;
        color: #0a0a0f;
        font-weight: 600;
      }
    }

    .size-table-wrapper {
      overflow-x: auto;
    }

    .size-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 2rem;

      th, td {
        padding: 1rem;
        text-align: center;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      th {
        background: rgba(201, 169, 98, 0.1);
        color: #c9a962;
        font-weight: 600;
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      td {
        color: rgba(255, 255, 255, 0.8);
        background: rgba(255, 255, 255, 0.02);
      }

      .size-label {
        font-weight: 700;
        color: white;
        background: rgba(201, 169, 98, 0.05);
      }

      tbody tr:hover td {
        background: rgba(201, 169, 98, 0.08);
      }
    }

    .measurement-tips {
      background: rgba(255, 255, 255, 0.03);
      border-radius: 16px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;

      h3 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: white;
        font-size: 1.1rem;
        margin: 0 0 1.25rem 0;

        .material-icons {
          color: #c9a962;
        }
      }
    }

    .tips-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .tip {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 12px;

      .tip-icon {
        font-size: 1.5rem;
      }

      strong {
        display: block;
        color: white;
        margin-bottom: 0.25rem;
        font-size: 0.95rem;
      }

      p {
        margin: 0;
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.6);
        line-height: 1.4;
      }
    }

    .fit-note {
      display: flex;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.2);
      border-radius: 12px;

      .material-icons {
        color: #3b82f6;
        flex-shrink: 0;
      }

      p {
        margin: 0;
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.7);
        line-height: 1.5;
      }
    }

    @media (max-width: 768px) {
      .modal-container {
        padding: 1.5rem;
      }

      .tips-grid {
        grid-template-columns: 1fr;
      }

      .category-tabs {
        justify-content: flex-start;
      }

      .tab {
        padding: 0.6rem 1rem;
        font-size: 0.9rem;
      }
    }
  `]
})
export class SizeGuideComponent {
  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<void>();

  activeCategory = signal<'shirts' | 'tshirts' | 'pants' | 'suits'>('shirts');

  setCategory(category: 'shirts' | 'tshirts' | 'pants' | 'suits') {
    this.activeCategory.set(category);
  }

  close() {
    this.closeModal.emit();
  }
}
