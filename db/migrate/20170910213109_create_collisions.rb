class CreateCollisions < ActiveRecord::Migration[5.1]
  def change
    create_table :collisions do |t|
      t.point :location
      t.float :latitude
      t.float :longitute
      t.string :street_name
      t.date :date
      t.string :borough
      t.integer :cyclists_injured
      t.integer :cyclists_killed
      t.integer :pedestrians_injured
      t.integer :pedestrians_killed

      t.timestamps
    end
  end
end
