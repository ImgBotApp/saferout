class AddBoroughToCollisionData < ActiveRecord::Migration[5.1]
  def change
    drop_table :collision_data 
  end
end
