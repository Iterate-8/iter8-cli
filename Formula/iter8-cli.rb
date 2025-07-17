class Iter8Cli < Formula
  desc "CLI Tool for Iter8 customers - Get personalized feedback and apply code changes"
  homepage "https://github.com/your-org/iter8-cli"
  version "1.0.0"
  
  if OS.mac?
    url "https://github.com/your-org/iter8-cli/releases/download/v1.0.0/iter8-cli-macos"
    sha256 "af29025b482ce21cfb63279cde221fcce62e2eaa22afcfd537125445367809cd"
  end
  
  def install
    if OS.mac?
      bin.install "iter8-cli-macos" => "iter8"
    end
  end

  test do
    assert_match "ITER8 CLI", shell_output("#{bin}/iter8 --version")
  end
end 