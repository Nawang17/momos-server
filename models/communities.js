module.exports = (sequelize, DataTypes) => {
  const communities = sequelize.define("communities", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: "name",
    },

    banner: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    bannerkey: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    private: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  });
  communities.associate = (models) => {
    communities.hasMany(models.communitymembers, {
      foreignKey: "communityId",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
    communities.hasMany(models.posts, {
      foreignKey: "communityid",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
  };
  return communities;
};
