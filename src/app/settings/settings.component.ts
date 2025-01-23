import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NgForOf} from "@angular/common";
import {Item} from "../models/item.model";
import {ItemService} from "../item.service";

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    FormsModule,
    NgForOf,
    ReactiveFormsModule
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  allItems?: any;
  categories: string[] = [];
  newCategory: string = '';
  selectedCategory: string = '';
  selectedIndex: number = -1;

  @ViewChild('editCategoryModal') editCategoryModal?: ElementRef;

  constructor(private itemService: ItemService) {}

  ngOnInit() {
    this.getAllItems();
  }

  // Generate a safe ID for categories
  getSafeCategoryId(category: string): string {
    return category.replace(/\s+/g, '').toLowerCase();
  }

  closeModal() {
    if (this.editCategoryModal) {
      const modalElement = this.editCategoryModal.nativeElement;

      // Remove the 'show' class
      modalElement.classList.remove('show');
      // Set display to none
      modalElement.style.display = 'none';

      // Remove the backdrop
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) {
        backdrop.remove();
      }
    }
  }

  getAllItems() {
    try {
      this.itemService.getAllItemsFromFirestore().then((res) => {
        this.allItems = res;
        this.categories = [...new Set(this.allItems.map((item: Item) => item.category))] as string[];
        console.log(this.categories);
        console.log(this.allItems);
      });
    } catch (error) {
      console.error('Error fetching documents: ', error);
    }
  }

  addNewCategory(newCategory: string) {
    console.log(newCategory);
    if (newCategory && this.categories && !this.categories.includes(newCategory)) {
      const newCategoryItem: any = {
        "name": `Novi artikal za ${newCategory}`,
        "quantity": 1,
        "description": "Opis artikla",
        "category": newCategory
      };

      this.itemService.addNewCategoryToFirestore(newCategoryItem).then(() => {
        console.log('Item with new category added successfully!');
        this.getAllItems();
        this.newCategory = '';
      }).catch((error) => {
        console.error('Error adding item: ', error);
      });
    }
  }

  openEditModal(category: string, index: number) {
    this.selectedCategory = category;
    this.selectedIndex = index;

    const modalElement = document.getElementById('editCategoryModal');
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  updateCategory() {
    if (this.selectedIndex >= 0) {
      this.updateCategoryInBothCollections(this.selectedCategory, this.categories[this.selectedIndex]);
    }
    this.closeModal();
  }

  updateCategoryInBothCollections(newCategory: string, oldCategory: string) {
    this.updateCategoryInCollection('ShoppingItems', oldCategory, newCategory);
    this.updateCategoryInCollection('SelectedItems', oldCategory, newCategory);
  }

  updateCategoryInCollection(collectionName: string, oldCategory: string, newCategory: string) {
    this.itemService.updateCategoryNameInFirestore(collectionName, oldCategory, newCategory).then(() => {
      console.log('Category name updated successfully');
      this.getAllItems();
    }).catch((err) => {
      console.log('Something went wrong', err);
    });
  }

  deleteCategory(category: string, i: number) {
    const userConfirmed = window.confirm(`Potvrdom će se izbrisati "${category}" i svi artikli koji joj pripadaju. Sigurno želiš nastaviti?`);
    console.log(userConfirmed);
    if (userConfirmed) {
      this.itemService.deleteAllItemsWithThisCategoryInFirestore(category, i).then(() => {
        console.log('Category name updated successfully');
        this.getAllItems();
      }).catch((err) => {
        console.log('Something went wrong', err);
      });
      alert(`Kategorija "${category}" i svi artikli koji joj pripadaju su uspješno izbrisani`);
    } else {
      alert('Brisanje otkazano.');
    }
  }
}
