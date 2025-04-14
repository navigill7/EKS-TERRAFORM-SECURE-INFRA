env = "dev"
region = "us-east-1"
vpc_name = "eks_vpc"
igw_name = "igw"
eks_public_subnet_count = 3
pub_cidr_block = [ "10.16.0.0/20" , "10.16.16.0/20" , "10.16.32.0/20" ]
pub_az = [ "us-east-1a" , "us-east-1b" , "us.east-1c" ]
pub_sub_name = "eks-public-subnet"
pri-az = [ "us-east-1a" , "us-east-1b" , "us.east-1c" ]
private_cidr_block = [ "10.16.128.0/20" , "10.16.144.0/20" , "10.16.160.0/20" ]
pri_sub_name = "eks-private-subnet"
eip_name = "eks-nat-eip"
eks_nat_gateway = "eks-ngw"
eks_sg_name = "eks-sg-name"


// eks variables 

is_eks_cluster_enabled = true

kubernetes_version = "1.29"
cluster-name = "eks-cluster"
cluster_private_access = true
cluster_public_access = false
ondemand_instance_type = ["t3a.medium"]
spot_instance_type = ["c5a.large", "c5a.xlarge", "m5a.large", "m5a.xlarge", "c5.large", "m5.large", "t3a.large", "t3a.xlarge", "t3a.medium"]
desired_capacity_ondemand = "1"
desired_capacity_spot_node = "1"
min_capacity_ondemand = "1"
max_capacity_ondemand = "4"
min_capacity_spot_node = "1"
max_capacity_spot_node = "4"

addons = [
  {
    name    = "vpc-cni",
    version = "v1.18.1-eksbuild.1"
  },
  {
    name    = "coredns"
    version = "v1.11.1-eksbuild.9"
  },
  {
    name    = "kube-proxy"
    version = "v1.29.3-eksbuild.2"
  },
  {
    name    = "aws-ebs-csi-driver"
    version = "v1.30.0-eksbuild.1"
  }
]