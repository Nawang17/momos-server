module.exports = (sequelize) => {
  const nestedcommentlikes = sequelize.define("nestedcommentlikes");

  nestedcommentlikes.associate = (models) => {
    nestedcommentlikes.belongsTo(models.users, {
      foreignKey: "userId",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
    nestedcommentlikes.belongsTo(models.nestedcomments, {
      foreignKey: "nestedcommentId",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });

    nestedcommentlikes.hasMany(models.notis, {
      foreignKey: "nestedcommentlikeId",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
  };
  return nestedcommentlikes;
};
