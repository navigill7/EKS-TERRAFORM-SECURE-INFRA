variable "cluster-name" {
    type = "String"
    default = "eks-infra"
}

variable "cidr_block" {
  
}

variable "vpc_name" {
  
}

variable "env" {
  
}

variable "igw_name" {
  
}

variable "eks_public_subnet_count" {
  
}

variable "pub_cidr_block" {
  

}

variable "private_cidr_block" {
  
}

variable "pub_az" {
  
}

variable "pri-az" {
  
}


variable "pub_sub_name" {
  
}

variable "pri_sub_name" {
  

}

variable "eks_private_subnet_count" {
  
}


variable "public-rt-name" {
  
}

variable "eip_name" {
  
}

variable "eks_nat_gateway" {
  
}

variable "eks_private_rt_name" {
  
}

// iam role and policy 

variable "is_eks_role_enabled" {
  
}


// eks 

variable "is_eks_cluster_enabled" {
  
}

variable "kubernetes_version" {
  
}

variable "cluster_private_access" {
  
}

variable "cluster_public_access" {
  
}

variable "addons" {
  
}

variable "desired_capacity_ondemand" {
  
}

variable "min_capacity_ondemand" {
  
}

variable "max_capacity_ondemand" {
  
}

variable "ondemand_instance_type" {
  
}

// spot node group

variable "desired_capacity_spot_node" {
  
}

variable "min_capacity_spot_node" {
  
}

variable "max_capacity_spot_node" {
  
}

variable "spot_instance_type" {
  
}

