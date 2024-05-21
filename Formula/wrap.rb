# typed: false
# frozen_string_literal: true

class Wrap < Formula
  desc "Generates 'wraps' for functions in any language using 'processors'"
  homepage "https://github.com/Yarden-zamir/WRAP"
  url "https://github.com/Yarden-zamir/WRAP/archive/v0.2.93.tar.gz"
  sha256 "bfb1dec9b67869d11dda7266951270f0a866e38ed054fd4b454d8a2c540785d1"
  license "MIT"

  depends_on "python@3.11"

  def install
    libexec.install Dir["*"]
    bin.write_exec_script libexec/"wrap"
    (libexec/"VERSION").write version
  end

  def caveats
    <<~EOS
      To activate wrap, run the following command:
        wrap install
      You can also use
        wrap install --help
      for custom installation.
    EOS
  end
end
