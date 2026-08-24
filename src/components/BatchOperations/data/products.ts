export interface Product {
  productCode: string;
  productName: string;
  productSpec: string;
  productPath: string;
  productVersion: number;
}

export const mockAllProducts: Product[] = [
  {
    productCode: '9999-0001',
    productName: 'SPCZDF06BA-A625BENNN-MERGE',
    productSpec: '6寸抛光片',
    productPath: '6寸抛光片',
    productVersion: 3
  },
  {
    productCode: '9999-0002',
    productName: 'SPCZDF06BA-A625BENNN',
    productSpec: '6寸抛光片',
    productPath: '6寸抛光片',
    productVersion: 3
  },
  {
    productCode: '9999-0003',
    productName: 'SPCZDF06BA-A625BENNN-SPECIAL',
    productSpec: '6寸抛光片',
    productPath: '6寸抛光片',
    productVersion: 3
  }
];