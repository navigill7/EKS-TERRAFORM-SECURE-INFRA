locals {
  org = "medium"

  env = var.env
}


module "eks" {
    source = "../module"

    env = var.env
    cluster-name = var.cluster-name
    vpc_name = var.vpc_name
    igw_name = var.igw_name
    eks_public_subnet_count = var.eks_public_subnet_count
    pub_cidr_block = var.pub_cidr_block
    pub_az = var.pub_az
    pub_sub_name = "${local.env}-${local.org}-${var.pub_sub_name}"
    private_cidr_block = var.private_cidr_block
    pri-az = var.pri-az
    eks_private_subnet_count = var.eks_private_subnet_count
    pri_sub_name = "${local.env}-${local.org}-${var.pri_sub_name}"
    public-rt-name = "${local.env}-${local.org}-${var.public-rt-name}"
    eks_private_rt_name = "${local.env}-${local.org}-${var.eks_private_rt_name}"
    eip_name = "${local.env}-${local.org}-${var.eip_name}"
    eks_nat_gateway = "${local.env}-${local.org}-${var.eks_nat_gateway}"
    eks_sg_name = var.eks_sg_name

    is_eks_role_enabled = true
    is_eks_nodegroup_role_enabled = true
    ondemand_instance_type = var.ondemand_instance_type
    desired_capacity_ondemand = var.desired_capacity_ondemand
    desired_capacity_spot_node = var.desired_capacity_spot_node
    max_capacity_ondemand = var.max_capacity_ondemand
    min_capacity_ondemand = var.min_capacity_ondemand
    max_capacity_spot_node = var.max_capacity_spot_node
    min_capacity_spot_node = var.min_capacity_spot_node
    cluster_private_access = var.cluster_private_access
    cluster_public_access = var.cluster_public_access
    addons = var.addons
    kubernetes_version = var.kubernetes_version
    is_eks_cluster_enabled = var.is_eks_cluster_enabled
    spot_instance_type = var.spot_instance_type
    cidr_block = var.cidr_block
    is_eks_cluster_enabled = var.is_eks_cluster_enabled
}