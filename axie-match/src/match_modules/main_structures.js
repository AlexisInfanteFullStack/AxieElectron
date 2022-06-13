const { AxieGene } = require("agp-npm/dist/axie-gene");

//  -------------------------------------------------------------------------------------------------------

//  Axie class ( main structure used throughout the matching process )

//  -------------------------------------------------------------------------------------------------------

class Axie {

    constructor(id, image, axie_class, name, genes_hex, sire_id, matron_id, breed_count, auction, ronin, ronin_name) {
      this.id = id;
      this.image = image;
      this.class = axie_class;
      this.name = name;
      this.genes_hex = genes_hex;
      this.genes = this.create_genes(genes_hex);
      this.sire_id = sire_id;
      this.matron_id = matron_id;
      this.breed_count = breed_count;
      this.auction = auction;
      this.ronin = ronin;
      this.ronin_name = ronin_name;
    }
  
    create_genes(genes_hexadecimal) {
      const genes_object = new AxieGene(genes_hexadecimal);
      return {
        eyes: genes_object.eyes,
        ears: genes_object.ears,
        mouth: genes_object.mouth,
        horn: genes_object.horn,
        back: genes_object.back,
        tail: genes_object.tail    
      } 
    }
}
  

//  -------------------------------------------------------------------------------------------------------


exports.Axie = Axie;