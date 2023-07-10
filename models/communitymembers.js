module.exports = (sequelize, DataTypes) => {
  const communitymembers = sequelize.define("communitymembers", {
    isadmin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isOwner: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  });
  communitymembers.associate = (models) => {
    communitymembers.belongsTo(models.users, {
      foreignKey: "userId",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
    communitymembers.belongsTo(models.communities, {
      foreignKey: "communityId",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
  };
  return communitymembers;
};
